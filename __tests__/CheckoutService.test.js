import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { Pedido } from '../src/domain/Pedido.js';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';

describe('CheckoutService', () => {
    const cartaoCredito = { numero: '4111111111111111', cvv: '123' };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('quando o pagamento falha', () => {
        it('deve retornar null e não salvar o pedido nem enviar e-mail', async () => {
            // Arrange
            const carrinho = CarrinhoBuilder.umCarrinho().build();

            // Stub: apenas fornece uma resposta pré-definida ao SUT
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: false }) };

            // Dummies: preenchem o construtor, não devem ser usados neste fluxo
            const repositoryDummy = { salvar: jest.fn() };
            const emailDummy = { enviarEmail: jest.fn() };

            const checkoutService = new CheckoutService(gatewayStub, repositoryDummy, emailDummy);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, cartaoCredito);

            // Assert (Verificação de Estado)
            expect(pedido).toBeNull();
            expect(repositoryDummy.salvar).not.toHaveBeenCalled();
            expect(emailDummy.enviarEmail).not.toHaveBeenCalled();
        });
    });

    describe('quando um cliente Premium finaliza a compra', () => {
        let gatewayStub;
        let repositoryStub;
        let emailMock;
        let pedidoSalvo;
        let resultado;

        beforeEach(async () => {
            // Arrange
            const usuarioPremium = UserMother.umUsuarioPremium();
            const carrinho = CarrinhoBuilder.umCarrinho()
                .comUser(usuarioPremium)
                .comItens([new Item('Fone de Ouvido', 120), new Item('Mouse', 80)]) // R$ 200,00
                .build();

            pedidoSalvo = new Pedido(42, carrinho, 180, 'PROCESSADO');

            // Stubs: controlam o fluxo, fornecendo respostas pré-definidas
            gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            repositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };

            // Mock: queremos verificar a interação (efeito colateral)
            emailMock = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

            // Act
            resultado = await checkoutService.processarPedido(carrinho, cartaoCredito);
        });

        it('deve cobrar o valor com 10% de desconto (R$ 180,00)', () => {
            // Assert
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, cartaoCredito);
        });

        it('deve enviar exatamente um e-mail de aprovação para o cliente', () => {
            // Assert (Verificação de Comportamento)
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com',
                'Seu Pedido foi Aprovado!',
                expect.stringContaining('R$180')
            );
        });

        it('deve retornar o pedido salvo pelo repositório', () => {
            // Assert (Verificação de Estado)
            expect(resultado).toBe(pedidoSalvo);
        });
    });

    describe('quando um cliente Padrão finaliza a compra', () => {
        it('deve cobrar o valor integral, sem desconto', async () => {
            // Arrange
            const carrinho = CarrinhoBuilder.umCarrinho()
                .comUser(UserMother.umUsuarioPadrao())
                .comItens([new Item('Fone de Ouvido', 120), new Item('Mouse', 80)])
                .build();
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = { salvar: jest.fn().mockResolvedValue(new Pedido(1, carrinho, 200, 'PROCESSADO')) };
            const emailDummy = { enviarEmail: jest.fn().mockResolvedValue(undefined) };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailDummy);

            // Act
            await checkoutService.processarPedido(carrinho, cartaoCredito);

            // Assert
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(200, cartaoCredito);
        });
    });

    describe('quando o envio de e-mail falha', () => {
        it('não deve falhar o checkout e deve retornar o pedido salvo', async () => {
            // Arrange
            const carrinho = CarrinhoBuilder.umCarrinho().build();
            const pedidoSalvo = new Pedido(7, carrinho, 100, 'PROCESSADO');
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };
            const emailStub = { enviarEmail: jest.fn().mockRejectedValue(new Error('SMTP fora do ar')) };
            jest.spyOn(console, 'error').mockImplementation(() => {});
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailStub);

            // Act
            const resultado = await checkoutService.processarPedido(carrinho, cartaoCredito);

            // Assert
            expect(resultado).toBe(pedidoSalvo);
        });
    });
});
