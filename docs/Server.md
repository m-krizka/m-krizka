# Structure
The server uses the _express_ framework and the Model-View-Controller (MVC) pattern. _webpack_ bundles all modules into ```dist/server.bundle.js```.
```
.
├── _helpers
│   ├── db.js
│   ├── error-handler.js
│   └── jwt.js
├── server.js
├── table
│   ├── table.cleanup.js
│   ├── table.controller.js
│   ├── table.model.js
│   ├── table.service.js
│   └── table.validation.js
└── users
    ├── regToken.model.js
    ├── user.model.js
    ├── user.service.js
    └── users.controller.js
```
# Server Routes
All server routes require a valid JWT token with the exception of public user routes required for authentication.

Table API routes are generated by iterating over the ```_tables.js``` file. A route is generated for every main table, passing in the url property. A route for a sub-table is created by using the url property with an added '-mapping' suffix.

```javascript
// Generate Table API routes
tables.forEach((table) => {
  app.use(`/api/${table.url}`, jwt());
  app.use(`/api/${table.url}`, tableController());
  if (table.type === 'collapsibleTable') {
    app.use(`/api/${table.url}-mapping`, tableController());
  }
});
```
# Model
Model represents the structure and format of the data and the constraints with which it is stored. A _mongoose_ schema is generated dynamically for each table from the ```_tables.js``` config file.

```javascript
...
const fieldTypes = {
  string: String,
  number: Number,
  radioDouble: Boolean,
  date: Date,
  select: String,
  aircraftSelect: String,
  grid: Array,
};

// Generate Mongoose schema for each table
tables.forEach((table) => {
  const specs = {
    status: { type: String, reguired: true },
    dateActivated: { type: Date, required: false },
    dateDeactivated: { type: Date, required: false },
  };
  table.fields.forEach((field) => {
    specs[field.fieldKey] = {
      type: fieldTypes[field.fieldType],
      required: field.required,
    };
  });
  const schema = new Schema(specs, { collection: table.schemaName.toLowerCase() });
  schema.set('toJSON', { virtuals: true });
  schemas[table.schemaName] = mongoose.model(table.schemaName, schema);
  ...
```
# Controller
Controller controls a user request for a particular route and chooses appropriate reponse based on the request type (GET, POST, PUT, DELETE). It then hands over control to the given function which executes a database operation, validation and cleanup and returns data back to the controller. The controller then passes data to the client (View).
```javascript
export const tableController = () => {
  // routes
  router.post('/', create);
  router.get('/', getAll);
  router.get('/:id', getById);
  router.put('/:id', update);
  router.delete('/:id', _delete);
  return router;
};

function create(req, res, next) {
  const { body, baseUrl } = req;
  tableService.create(body, baseUrl)
    .then(() => res.json({}))
    .catch(err => next(err));
}
...
```