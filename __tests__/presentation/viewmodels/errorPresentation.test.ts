// __tests__/presentation/viewmodels/errorPresentation.test.ts

import { domainErrorToMessage } from '@viewmodels/errorPresentation';
import { domainError } from '@domain/entities/DomainError';

describe('domainErrorToMessage', () => {
  it('traduce códigos conocidos a un mensaje para la usuaria', () => {
    const message = domainErrorToMessage(
      domainError('NO_ACTIVE_CYCLE', 'mensaje técnico interno')
    );
    expect(message).toBe(
      'Aún no has iniciado un ciclo. Empieza uno para registrar.'
    );
  });

  it('para un código sin traducción, cae de vuelta al mensaje técnico', () => {
    const message = domainErrorToMessage(
      domainError('UNKNOWN', 'algo raro pasó')
    );
    expect(message).toBe('algo raro pasó');
  });
});
