import { strFromU8, unzipSync } from 'fflate';

export type ModelAnalysis = {
  format: 'stl' | '3mf';
  filename: string;
  file_size_bytes: number;
  unit: string;
  width: number;
  depth: number;
  height: number;
  volume: number | null;
  surface_area: number | null;
  triangle_count: number;
  object_count: number;
  watertight: boolean | null;
  material: string | null;
  weight: number | null;
  weight_unit: string | null;
};

type Point = [number, number, number];
type Triangle = [Point, Point, Point];

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function normaliseUnit(value: string | null | undefined) {
  const units: Record<string, string> = {
    micrometer: 'um', micron: 'um', millimeter: 'mm', centimeter: 'cm', meter: 'm', inch: 'in', foot: 'ft',
  };
  return units[(value || '').toLowerCase()] || value || 'mm';
}

function analyseTriangles(triangles: Triangle[], base: Omit<ModelAnalysis, 'width' | 'depth' | 'height' | 'volume' | 'surface_area' | 'triangle_count' | 'watertight'>): ModelAnalysis {
  if (!triangles.length) throw new Error('No printable geometry was found in this file.');
  const min: Point = [Infinity, Infinity, Infinity];
  const max: Point = [-Infinity, -Infinity, -Infinity];
  const edges = new Map<string, number>();
  let area = 0;
  let signedVolume = 0;

  for (const triangle of triangles) {
    for (const point of triangle) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], point[axis]);
        max[axis] = Math.max(max[axis], point[axis]);
      }
    }
    const [a, b, c] = triangle;
    const ab: Point = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac: Point = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cross: Point = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
    area += Math.hypot(...cross) / 2;
    signedVolume += (a[0] * cross[0] + a[1] * cross[1] + a[2] * cross[2]) / 6;
    for (const [from, to] of [[a, b], [b, c], [c, a]] as [Point, Point][]) {
      const left = from.join(',');
      const right = to.join(',');
      const edge = left < right ? `${left}|${right}` : `${right}|${left}`;
      edges.set(edge, (edges.get(edge) || 0) + 1);
    }
  }

  return {
    ...base,
    width: round(max[0] - min[0]),
    depth: round(max[1] - min[1]),
    height: round(max[2] - min[2]),
    volume: round(Math.abs(signedVolume)),
    surface_area: round(area),
    triangle_count: triangles.length,
    watertight: [...edges.values()].every((count) => count === 2),
  };
}

function parseBinaryStl(bytes: Uint8Array, filename: string, unit: string): ModelAnalysis {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(80, true);
  if (bytes.byteLength < 84 + count * 50) throw new Error('This STL file appears to be incomplete.');
  const triangles: Triangle[] = [];
  let offset = 84;
  for (let index = 0; index < count; index += 1) {
    offset += 12;
    const points: Point[] = [];
    for (let point = 0; point < 3; point += 1) {
      points.push([view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)]);
      offset += 12;
    }
    triangles.push([points[0], points[1], points[2]]);
    offset += 2;
  }
  return analyseTriangles(triangles, { format: 'stl', filename, file_size_bytes: bytes.byteLength, unit, object_count: 1, material: null, weight: null, weight_unit: null });
}

function parseAsciiStl(text: string, filename: string, unit: string): ModelAnalysis {
  const values = [...text.matchAll(/vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/gi)].map((match) => [Number(match[1]), Number(match[2]), Number(match[3])] as Point);
  if (!values.length || values.length % 3 !== 0) throw new Error('This STL file does not contain readable triangle geometry.');
  const triangles: Triangle[] = [];
  for (let index = 0; index < values.length; index += 3) triangles.push([values[index], values[index + 1], values[index + 2]]);
  return analyseTriangles(triangles, { format: 'stl', filename, file_size_bytes: new TextEncoder().encode(text).byteLength, unit, object_count: 1, material: null, weight: null, weight_unit: null });
}

function parseStl(file: File, bytes: Uint8Array, unit: string) {
  const declaredCount = bytes.byteLength >= 84 ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(80, true) : 0;
  const binaryLooksValid = declaredCount > 0 && bytes.byteLength === 84 + declaredCount * 50;
  if (binaryLooksValid) return parseBinaryStl(bytes, file.name, unit);
  return parseAsciiStl(new TextDecoder().decode(bytes), file.name, unit);
}

function parse3mf(file: File, bytes: Uint8Array): ModelAnalysis {
  const files = unzipSync(bytes);
  const modelEntries = Object.entries(files).filter(([name]) => name.toLowerCase().endsWith('.model'));
  if (!modelEntries.length) throw new Error('The 3MF package does not contain a model file.');
  const triangles: Triangle[] = [];
  let objectCount = 0;
  let unit = 'mm';
  let material: string | null = null;
  let weight: number | null = null;
  let weightUnit: string | null = null;
  for (const [, modelBytes] of modelEntries) {
    const xml = new DOMParser().parseFromString(strFromU8(modelBytes), 'application/xml');
    if (xml.querySelector('parsererror')) continue;
    unit = normaliseUnit(xml.documentElement.getAttribute('unit'));
    for (const metadata of Array.from(xml.getElementsByTagNameNS('*', 'metadata'))) {
      const name = (metadata.getAttribute('name') || '').toLowerCase();
      const value = metadata.textContent?.trim() || '';
      if (!value) continue;
      if (!material && /^(material|material_name|filament|filament_type)$/.test(name)) material = value.slice(0, 120);
      if (weight === null && /^(weight|mass)$/.test(name)) {
        const match = value.match(/([0-9]+(?:\.[0-9]+)?)\s*(mg|g|kg|oz|lb)?/i);
        if (match) { weight = Number(match[1]); weightUnit = (match[2] || 'g').toLowerCase(); }
      }
    }
    for (const object of Array.from(xml.getElementsByTagNameNS('*', 'object'))) {
      const mesh = object.getElementsByTagNameNS('*', 'mesh')[0];
      if (!mesh) continue;
      const vertices = Array.from(mesh.getElementsByTagNameNS('*', 'vertex')).map((vertex) => [Number(vertex.getAttribute('x')), Number(vertex.getAttribute('y')), Number(vertex.getAttribute('z'))] as Point);
      let objectTriangles = 0;
      for (const triangle of Array.from(mesh.getElementsByTagNameNS('*', 'triangle'))) {
        const points = [Number(triangle.getAttribute('v1')), Number(triangle.getAttribute('v2')), Number(triangle.getAttribute('v3'))].map((index) => vertices[index]);
        if (points.every(Boolean)) {
          triangles.push([points[0], points[1], points[2]]);
          objectTriangles += 1;
        }
      }
      if (objectTriangles) objectCount += 1;
    }
  }
  return analyseTriangles(triangles, { format: '3mf', filename: file.name, file_size_bytes: file.size, unit, object_count: objectCount, material, weight, weight_unit: weightUnit });
}
export async function analyseModelFile(file: File, stlUnit = 'mm'): Promise<ModelAnalysis> {
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension !== 'stl' && extension !== '3mf') throw new Error('Please choose an STL or 3MF file.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > 50 * 1024 * 1024) throw new Error('Model files must be smaller than 50 MB.');
  return extension === '3mf' ? parse3mf(file, bytes) : parseStl(file, bytes, stlUnit);
}
