// Tests simplBase. Requires Node.js.

const assert = require('assert');
const simpl = require('./simplBase');

collapseExpand = function()
{
  var obj = {
    name: { firstname: 'first name', lastname: 'last name' },
    tags: [ 'tag1', 'tag2', 'tag3' ],
    refs: [ { name: { firstname: 'abc', lastname: 'def' } } ],
  }
  obj.refs.push(obj);

  var s0 = JSON.stringify(simpl.graphCollapse(obj));
  var o = simpl.graphExpand(obj);
  assert.strictEqual('first name', o.name.firstname);
  assert.strictEqual('last name', o.name.lastname);
  assert.strictEqual('tag1', o.tags[0]);
  assert.strictEqual('tag2', o.tags[1]);
  assert.strictEqual('tag3', o.tags[2]);
  assert.strictEqual('abc', o.refs[0].name.firstname);
  assert.strictEqual('def', o.refs[0].name.lastname);
  assert.strictEqual('first name', o.refs[1].name.firstname);
  assert.strictEqual('last name', o.refs[1].name.lastname);
  var s1 = JSON.stringify(simpl.graphCollapse(obj));
  assert.strictEqual(s0, s1);
}

roundtrip = function()
{
  var obj = {
    name: { firstname: 'first name', lastname: 'last name' },
    tags: [ 'tag1', 'tag2', 'tag3' ],
    refs: [ { name: { firstname: 'abc', lastname: 'def' } } ],
    gotcha: null,
    gotchaAgain: undefined,
  }
  obj.refs.push(obj);

  var s = simpl.serialize(obj);
  console.log(s);

  var o = simpl.deserialize(s, { debugging: true });
  assert.strictEqual('first name', o.name.firstname);
  assert.strictEqual('last name', o.name.lastname);
  assert.strictEqual('tag1', o.tags[0]);
  assert.strictEqual('tag2', o.tags[1]);
  assert.strictEqual('tag3', o.tags[2]);
  assert.strictEqual('abc', o.refs[0].name.firstname);
  assert.strictEqual('def', o.refs[0].name.lastname);
  assert.strictEqual('first name', o.refs[1].name.firstname);
  assert.strictEqual('last name', o.refs[1].name.lastname);
}

collapseExpand();
roundtrip();

