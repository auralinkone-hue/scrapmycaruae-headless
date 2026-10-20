import type { VehicleModel } from './vehicle-data';
export type ModelGuidance = { category: string; title: string; copy: string; checks: string[] };
export function manufacturerModels(models: VehicleModel[], make: string): VehicleModel[] {
  const seen = new Set<string>();
  return models.filter(item => item.make === make && item.model.trim()).sort((a,b)=>a.modelDisplayOrder-b.modelDisplayOrder).filter(item=>{
    const key=item.model.trim().toUpperCase();if(seen.has(key))return false;seen.add(key);return true;
  });
}
export const modelLabel = (name: string) => name.toLowerCase().replace(/\b\w/g, char=>char.toUpperCase()).replace(/Rav4/i,'RAV4');
export function resolveModelGuidance(model: string, profiles: Record<string, ModelGuidance>): ModelGuidance {
  return profiles[model] ?? { category:'Your vehicle', title:`Start with your ${modelLabel(model)}.`, copy:'The model name is a starting point. Its year, exact specification, known faults and completeness help explain the individual vehicle before a scrap valuation is discussed.', checks:['Year and specification, if known','Current condition and any missing components','Keys, mobility and the collection location'] };
}
