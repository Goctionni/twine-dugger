// The result of parsing is unknown until it's been validated, see `fromJson`
interface JSON {
  parse(text: string, reviver?: (this: any, key: string, value: any) => any): unknown;
}
