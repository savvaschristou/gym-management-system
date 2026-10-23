import { fakeStorage } from '../testUtils';
import { LocalStorageRepository } from './LocalStorageRepository';

interface Item {
  id: string;
  name: string;
}

function setup(initial: Record<string, string> = {}) {
  return new LocalStorageRepository<Item>('test.items', fakeStorage(initial));
}

describe('LocalStorageRepository', () => {
  // Edge case
  it('returns an empty list when nothing is stored yet', () => {
    expect(setup().findAll()).toEqual([]);
  });

  // Normal case
  it('saves a record and finds it by id', () => {
    const repo = setup();
    repo.save({ id: 'a', name: 'Squat' });
    expect(repo.findById('a')).toEqual({ id: 'a', name: 'Squat' });
    expect(repo.findById('missing')).toBeUndefined();
  });

  // Edge case
  it('replaces a record with the same id instead of duplicating it', () => {
    const repo = setup();
    repo.save({ id: 'a', name: 'Squat' });
    repo.save({ id: 'a', name: 'Front Squat' });
    expect(repo.findAll()).toEqual([{ id: 'a', name: 'Front Squat' }]);
  });

  // Normal case
  it('deletes a record and ignores ids that do not exist', () => {
    const repo = setup();
    repo.save({ id: 'a', name: 'Squat' });
    repo.save({ id: 'b', name: 'Bench' });
    repo.delete('a');
    repo.delete('missing');
    expect(repo.findAll()).toEqual([{ id: 'b', name: 'Bench' }]);
  });

  // Error case
  it('treats corrupted stored data as empty instead of crashing', () => {
    expect(setup({ 'test.items': 'not json' }).findAll()).toEqual([]);
    expect(setup({ 'test.items': '{"id":"a"}' }).findAll()).toEqual([]);
  });
});
