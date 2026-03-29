import { describe, expect, it } from 'vitest'
import { extractJson, hasTypeScript } from '../code-gen-utils'

describe('extractJson', () => {
  it('returns a bare JSON object unchanged', () => {
    expect(extractJson('{"a":1}')).toBe('{"a":1}')
  })

  it('strips markdown json fence', () => {
    const raw = '```json\n{"a":1}\n```'
    expect(JSON.parse(extractJson(raw))).toEqual({ a: 1 })
  })

  it('strips leading explanation text', () => {
    const raw = 'Here is your JSON:\n{"a":1}'
    expect(JSON.parse(extractJson(raw))).toEqual({ a: 1 })
  })

  it('strips trailing explanation text', () => {
    const raw = '{"a":1}\nHope that helps!'
    expect(JSON.parse(extractJson(raw))).toEqual({ a: 1 })
  })

  it('preserves nested objects', () => {
    const raw = '{"a":{"b":2}}'
    expect(JSON.parse(extractJson(raw))).toEqual({ a: { b: 2 } })
  })

  it('throws when response contains no JSON object', () => {
    expect(() => extractJson('no json here')).toThrow('No JSON object found in response.')
  })

  it('throws on empty string', () => {
    expect(() => extractJson('')).toThrow('No JSON object found in response.')
  })

  it('correctly handles text after JSON that contains }', () => {
    const raw = 'Result: {"a":1}. Also consider {"b":2} if needed.'
    expect(JSON.parse(extractJson(raw))).toEqual({ a: 1 })
  })
})

describe('hasTypeScript', () => {
  it('detects colon type annotation', () => {
    expect(hasTypeScript('function f(x: string) {}')).toBe(true)
  })

  it('detects generic parameter in function call', () => {
    expect(hasTypeScript('useState<string[]>([])')).toBe(true)
  })

  it('detects interface declaration', () => {
    expect(hasTypeScript('interface Foo { bar: string }')).toBe(true)
  })

  it('detects type alias declaration', () => {
    expect(hasTypeScript('type Foo = string | number')).toBe(true)
  })

  it('detects as-cast', () => {
    expect(hasTypeScript('const x = y as MyType')).toBe(true)
  })

  it('detects enum declaration', () => {
    expect(hasTypeScript('enum Color { Red, Blue }')).toBe(true)
  })

  it('detects non-null assertion', () => {
    expect(hasTypeScript('value!.prop')).toBe(true)
  })

  it('does NOT match JSX open tag with capital letter', () => {
    expect(hasTypeScript('<Button variant="default">Click</Button>')).toBe(false)
  })

  it('does NOT match JSX self-closing tag', () => {
    expect(hasTypeScript('<Input className="w-full" />')).toBe(false)
  })

  it('returns false for plain JSX with hooks', () => {
    const code = `
      function Component() {
        const [val, setVal] = useState('')
        return (
          <div className="flex flex-col gap-4">
            <Input value={val} onChange={e => setVal(e.target.value)} />
            <Button onClick={() => setVal('')}>Clear</Button>
          </div>
        )
      }
      render(<Component />)
    `
    expect(hasTypeScript(code)).toBe(false)
  })

  it('does NOT false-positive on object props with lowercase values', () => {
    expect(hasTypeScript('style={{ color: red, fontSize: large }}')).toBe(false)
  })

  it('detects TS primitive type annotation', () => {
    expect(hasTypeScript('function f(x: string) {}')).toBe(true)
  })

  it('detects single-identifier generic like useState<string>', () => {
    expect(hasTypeScript('useState<string>([])')).toBe(true)
  })

  it('detects useRef<HTMLDivElement>', () => {
    expect(hasTypeScript('useRef<HTMLDivElement>(null)')).toBe(true)
  })

  it('does NOT match plain JSX with style and event props', () => {
    const code = `
      function Component() {
        const [color, setColor] = useState('red')
        return <div style={{ color: color, gap: 4 }}><Button onClick={() => setColor('blue')}>Go</Button></div>
      }
      render(<Component />)
    `
    expect(hasTypeScript(code)).toBe(false)
  })
})
