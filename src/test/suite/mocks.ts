import * as mockery from 'mockery';
import * as sinon from 'sinon';

export function setUp () {
  mockery.enable({
    warnOnUnregistered: false
  });

  let stub = sinon.stub();
  stub.withArgs(sinon.match({ uri: 'https://api.todoist.com/rest/v2/tasks' })).resolves({ id: 66778899 });
  stub.withArgs(sinon.match({ uri: 'https://api.todoist.com/rest/v2/tasks/66778899' })).resolves({ id: 66778899, is_completed: false });
  // Not needed anymore
  // stub.withArgs(sinon.match({ uri: 'https://api.todoist.com/sync/v8/items/get' })).resolves({ item: { id: 66778899 } });

  mockery.registerMock('request-promise', stub);
}

export function tearDown () {
  mockery.deregisterAll();
  mockery.disable();
}
