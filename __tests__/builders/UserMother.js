import { User } from '../../src/domain/User.js';

/**
 * Object Mother: fornece instâncias fixas e nomeadas de User.
 * Usuários são entidades simples que variam pouco entre os testes,
 * então alguns "personagens" pré-definidos são suficientes.
 */
export class UserMother {
    static umUsuarioPadrao() {
        return new User(1, 'Usuário Padrão', 'padrao@email.com', 'PADRAO');
    }

    static umUsuarioPremium() {
        return new User(2, 'Usuário Premium', 'premium@email.com', 'PREMIUM');
    }
}
