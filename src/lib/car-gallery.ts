import {carManufacturers} from './car-manufacturers.ts';
import {manufacturerModels} from './manufacturer-models.ts';
import type {VehicleModel} from './vehicle-data';
export function buildCarGallery(models:VehicleModel[]){
 return carManufacturers.map(make=>({...make,models:manufacturerModels(models,make.make).map(item=>item.model)}));
}
