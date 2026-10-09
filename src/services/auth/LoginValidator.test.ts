import { LoginValidator } from './LoginValidator';

describe('LoginValidator', () => {
  const validator = new LoginValidator();

  it('reports both errors together for bad input', () => {
    expect(validator.validate({ email: 'nope', password: '123' })).toEqual([
      'Enter a valid email',
      'Password must be at least 6 characters',
    ]);
  });

  it('reports no errors for good input', () => {
    expect(validator.validate({ email: 'a@b.co', password: 'abcdef' })).toEqual([]);
  });
});
