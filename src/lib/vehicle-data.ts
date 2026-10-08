import { wixClient } from './wix';

export type VehicleMake = {
  make: string;
  displayOrder: number;
  featuredMake?: boolean;
};

export type VehicleModel = {
  make: string;
  model: string;
  makeDisplayOrder: number;
  modelDisplayOrder: number;
  featuredModel?: boolean;
};

export type VehicleYear = {
  year: number;
  displayOrder: number;
};

export type VehicleData = {
  makes: VehicleMake[];
  models: VehicleModel[];
  years: VehicleYear[];
};

const QUERY_URL = 'https://www.wixapis.com/data/v2/items/query';

async function queryCollection(
  accessToken: string,
  dataCollectionId: string,
  sort: Array<{ fieldName: string; order: 'ASC' | 'DESC' }>
) {
  const response = await fetch(QUERY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: accessToken
    },
    body: JSON.stringify({
      dataCollectionId,
      query: {
        filter: { active: true },
        sort,
        paging: { limit: 1000, offset: 0 }
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Wix CMS query failed for ${dataCollectionId}: ${response.status} ${message}`
    );
  }

  const data = await response.json();
  return data.dataItems ?? [];
}

export async function getVehicleData(): Promise<VehicleData> {
  const tokens = await wixClient.auth.generateVisitorTokens();
  const accessToken = tokens.accessToken?.value;

  if (!accessToken) {
    throw new Error('Could not generate a Wix visitor access token.');
  }

  const [makeItems, modelItems, yearItems] = await Promise.all([
    queryCollection(accessToken, 'VehicleMakes', [
      { fieldName: 'displayOrder', order: 'ASC' }
    ]),
    queryCollection(accessToken, 'VehicleModels', [
      { fieldName: 'makeDisplayOrder', order: 'ASC' },
      { fieldName: 'modelDisplayOrder', order: 'ASC' }
    ]),
    queryCollection(accessToken, 'VehicleYears', [
      { fieldName: 'displayOrder', order: 'ASC' }
    ])
  ]);

  return {
    makes: makeItems
      .map((item: any) => ({
        make: String(item.data?.make ?? '').trim(),
        displayOrder: Number(item.data?.displayOrder ?? 9999),
        featuredMake: Boolean(item.data?.featuredMake)
      }))
      .filter((item: VehicleMake) => item.make),

    models: modelItems
      .map((item: any) => ({
        make: String(item.data?.make ?? '').trim(),
        model: String(item.data?.model ?? '').trim(),
        makeDisplayOrder: Number(item.data?.makeDisplayOrder ?? 9999),
        modelDisplayOrder: Number(item.data?.modelDisplayOrder ?? 9999),
        featuredModel: Boolean(item.data?.featuredModel)
      }))
      .filter((item: VehicleModel) => item.make && item.model),

    years: yearItems
      .map((item: any) => ({
        year: Number(item.data?.year),
        displayOrder: Number(item.data?.displayOrder ?? 9999)
      }))
      .filter((item: VehicleYear) => Number.isFinite(item.year))
  };
}
