/* tslint:disable:no-empty */
/* tslint:disable:whitespace */
import { script }       from 'lab';
import { expect }       from 'chai';
import functionToParams from '../src/lib/functionToParams';

export const lab = script();
const { describe, it } = lab;

describe('functionToParams', () => {
  it('parses a named function with simple params', done => {
    function func(one, two, three) {}
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'two', 'three']);
    done();
  });

  it('parses a named function with multi-line comments', done => {
    function func(one, /* two, */three) {}
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'three']);
    done();
  });

  it('parses a named function with end-of-line comments', done => {
    function func(one,
      // two,
      three) {}
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'three']);
    done();
  });

  it('parses a named function with default values', done => {
    function func(one, two = { four: {} }, three) {}
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'two', 'three']);
    done();
  });

  it('parses an arrow function', done => {
    const func = (one,two, three) => {};
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'two', 'three']);
    done();
  });

  it('parses an arrow function with default values', done => {
    const func = (one = { four: {} },two, three) =>  {};
    const result = functionToParams(func);
    expect(result).to.eql(['one', 'two', 'three']);
    done();
  });

  it('parses an arrow function with comments', done => {
    const func = (one /* = { four: {} },two, three) =>  {*/) => {};
    const result = functionToParams(func);
    expect(result).to.eql(['one']);
    done();
  });
});
