# Manufacturer form contract

For Toyota, Nissan, Mercedes-Benz and future manufacturer pages:

- Pass the complete `getVehicleData()` catalogue into QuoteForm: `makes={vehicleData.makes} models={vehicleData.models} years={vehicleData.years}`. Never filter form options to the page brand.
- Filter only the model explorer with `manufacturerModels(vehicleData.models, pageMake)` and keep its heading/controls explicitly labelled with the page brand.
- Use one `data-manufacturer-quote` form wrapper and the shared `ManufacturerInteractions` controller. Its explorer config `make` must exactly match the live CMS make key.
- The controller preselects the page make only when the form make is empty. Manual make changes remain authoritative. QuoteForm handles clearing/repopulating dependent models.
- Explorer selection deliberately sets both make and model through existing change events. Reverse form synchronisation runs only for the page make. Year, name and phone must not be reset.
- Do not add per-page form initialisers, API fields or duplicated form logic. The catalogue regression test automatically checks new manufacturer routes.
