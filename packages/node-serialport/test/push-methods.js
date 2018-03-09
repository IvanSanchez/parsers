'use strict';
/* eslint-disable no-new */

const assert = require('chai').assert;
const pushBindingWrap = require('../lib/push-methods');
const MockBinding = require('../lib/bindings-mock');

describe('pushBindingWrap()', function() {
  it('throws when not passed a binding', function(done) {
    try {
      pushBindingWrap({ push() {} });
    } catch (e) {
      assert.instanceOf(e, TypeError);
      done();
    }
  });

  it('throws when not passed a push function', function(done) {
    try {
      pushBindingWrap({ binding: {} });
    } catch (e) {
      assert.instanceOf(e, TypeError);
      done();
    }
  });

  it('assigns `_read()` only if not already a method', function(done) {
    const mockBinding = new MockBinding({ disconnect() {} });
    assert.isUndefined(mockBinding._read);
    pushBindingWrap({ binding: mockBinding, push() {} });
    assert.equal(typeof mockBinding._read, 'function');

    const _read = function() {};
    const fakeBinding = { _read };
    pushBindingWrap({ binding: fakeBinding, push() {} });
    assert.equal(fakeBinding._read, _read);
    done();
  });

  it('assigns `push()` only if not already a method', function(done) {
    const mockBinding = new MockBinding({ disconnect() {} });
    assert.isUndefined(mockBinding.push);
    pushBindingWrap({ binding: mockBinding, push() {} });
    assert.equal(typeof mockBinding.push, 'function');

    const push = function() {};
    const fakeBinding = { push };
    pushBindingWrap({ binding: fakeBinding, push() {} });
    assert.equal(fakeBinding.push, push);
    done();
  });
});

describe('_read()', function() {
  it('calls `read()` with the right arguments', function(done) {
    const bytesToRead = 5;
    const fakeBinding = {
      read(buffer, offset, bytes) {
        assert.instanceOf(buffer, Buffer);
        assert.isNumber(offset);
        assert.isNumber(bytes);
        assert(bytes > 0);
        done();
      }
    };
    pushBindingWrap({ binding: fakeBinding, push() {} });
    fakeBinding._read(bytesToRead);
  });

  it('calls push with available data', function(done) {
    const readData = new Buffer('12345!');
    const fakeBinding = {
      read(buffer, offset, bytes, cb) {
        readData.copy(buffer, offset);
        process.nextTick(cb.bind(null, null, readData.length, buffer));
      },
      push(data) {
        assert.deepEqual(data, readData);
        done();
        return false;
      }
    };
    pushBindingWrap({ binding: fakeBinding, push() {} });
    fakeBinding._read(6);
  });
});
