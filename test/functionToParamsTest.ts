/* tslint:disable:no-empty */
/* tslint:disable:whitespace */
import { script }       from 'lab';
import { expect }       from 'chai';
import functionToParams from '../src/lib/functionToParams';

export const lab = script();
const { describe, it } = lab;

describe('functionToParams', () => {
  it('parses a named function with simple params', () => {
    function func(one, two, three) {}
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'two', 'three']);
  });

  it('parses a named function with multi-line comments', () => {
    function func(one, /* two, */three) {}
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'three']);
  });

  it('parses a named function with end-of-line comments', () => {
    function func(one,
      // two,
      three) {}
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'three']);
  });

  it('parses a named function with default values', () => {
    function func(one, two = { four: {} }, three) {}
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'two', 'three']);
  });

  it('parses an arrow function', () => {
    const func = (one,two, three) => {};
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'two', 'three']);
  });

  it('parses an arrow function with default values', () => {
    const func = (one = { four: {} },two, three) =>  {};
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'two', 'three']);
  });

  it('parses an arrow function with comments', () => {
    const func = (one /* = { four: {} },two, three) =>  {*/) => {};
    const result = functionToParams(func);
    expect(result).to.eql(['one']);
  });
});
