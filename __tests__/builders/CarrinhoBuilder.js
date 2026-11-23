import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './UserMother.js';

/**
 * Data Builder: constrói Carrinhos de forma fluente.
 * Por padrão gera um carrinho válido (usuário padrão + 1 item de R$ 100,00);
 * cada teste sobrescreve apenas o que é relevante para o seu cenário.
 */
export class CarrinhoBuilder {
    constructor() {
        this.user = UserMother.umUsuarioPadrao();
        this.itens = [new Item('Produto Padrão', 100)];
    }

    static umCarrinho() {
        return new CarrinhoBuilder();
    }

    comUser(user) {
        this.user = user;
        return this;
    }

    comItens(itens) {
        this.itens = [...itens];
        return this;
    }

    comItem(nome, preco) {
        this.itens.push(new Item(nome, preco));
        return this;
    }

    vazio() {
        this.itens = [];
        return this;
    }

    build() {
        return new Carrinho(this.user, [...this.itens]);
    }
}
