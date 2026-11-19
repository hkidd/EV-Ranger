const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createHash } = require('node:crypto')
const ts = require('typescript')
const parser = {}
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('src/data/vehicleCatalog.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText,
  { exports: parser }
)
const manifest = JSON.parse(
  fs.readFileSync('public/data/catalog-manifest.json')
)
test('archive shards have unique records, valid range and matching model years', () => {
  const ids = new Set()
  let total = 0
  for (const entry of manifest.years) {
    assert.match(entry.file, /^catalog\/\d{4}-[a-f0-9]+\.json$/)
    const bytes = fs.readFileSync(path.join('public/data', entry.file), 'utf8')
    const shard = JSON.parse(bytes)
    const hash = createHash('sha256')
      .update(JSON.stringify(shard))
      .digest('hex')
      .slice(0, 16)
    assert(entry.file.endsWith(`-${hash}.json`))
    const parsed = parser.parseVehicleCatalog(shard)
    assert.equal(parsed.configurationCount, entry.count)
    for (const vehicle of shard.vehicles) {
      assert.equal(vehicle.modelYear, entry.year)
      assert(!ids.has(vehicle.epaVehicleId))
      ids.add(vehicle.epaVehicleId)
      assert.equal(manifest.idYears[`epa-${vehicle.epaVehicleId}`], entry.year)
    }
    total += entry.count
  }
  assert.equal(total, manifest.configurationCount)
  assert(manifest.years.some((entry) => entry.year === 2000))
  assert(manifest.years.length > 20)
})
test('default download omits historical archive, while keeping all selected recent years', () => {
  const recent = JSON.parse(fs.readFileSync('public/data/vehicles.json'))
  assert(
    recent.vehicles.every((vehicle) =>
      manifest.defaultYears.includes(vehicle.modelYear)
    )
  )
  assert.equal(
    recent.vehicles.length,
    manifest.years
      .filter((entry) => manifest.defaultYears.includes(entry.year))
      .reduce((sum, entry) => sum + entry.count, 0)
  )
  assert(recent.vehicles.length < manifest.configurationCount)
})
