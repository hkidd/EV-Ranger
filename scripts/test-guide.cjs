const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const guide = {}
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync('src/modules/Buyer/guideState.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022
      }
    }
  ).outputText,
  { exports: guide }
)

test('guide preserves dismissal, completion and valid progress without reopening an unwanted tour', () => {
  for (const stage of [...guide.GUIDE_STEPS, 'dismissed', 'complete']) {
    const storage = {
      getItem: (key) => {
        assert.equal(key, guide.GUIDE_KEY)
        return stage
      }
    }
    assert.equal(guide.readGuide(storage), stage)
  }
  for (const value of [null, '', 'unknown', '{"step":"cars"}']) {
    assert.equal(guide.readGuide({ getItem: () => value }), 'welcome')
  }
})
test('blocked device storage does not prevent the guide from opening or being skipped', () => {
  assert.equal(
    guide.readGuide({
      getItem: () => {
        throw Error('blocked')
      }
    }),
    'welcome'
  )
  assert.equal(guide.readGuide(), 'welcome')
  assert.doesNotThrow(() =>
    guide.saveGuide('dismissed', {
      setItem: () => {
        throw Error('blocked')
      }
    })
  )
  let saved
  guide.saveGuide('complete', {
    setItem: (key, value) => {
      saved = [key, value]
    }
  })
  assert.deepEqual(saved, [guide.GUIDE_KEY, 'complete'])
})
