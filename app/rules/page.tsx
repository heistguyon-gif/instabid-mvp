import type { Metadata } from 'next';
import { InfoPage } from '@/components/InfoPage';

export const metadata: Metadata = { title: 'Regras — Instabid', description: 'Como posição, boosts, cliques e moderação funcionam no Instabid.' };

export default function RulesPage() {
  return <InfoPage eyebrow="Transparência do produto · Product transparency" title="As regras precisam caber na tela — e resistir a uma disputa." lead="O Instabid vende exposição patrocinada mensurável. Não vende prêmio, sorte, seguidores ou garantia de retorno.">
    <p className="notice"><b>Piloto pago:</b> cobranças Pix no mercado BR são processadas pela BravoPay. A posição só muda depois que o servidor confirma o pagamento.</p>
    <h2>1. Como a posição é calculada</h2><ol><li>O ranking semanal soma apenas boosts confirmados dentro da temporada atual.</li><li>Últimas 24h usa uma janela móvel; Histórico soma boosts confirmados de todas as temporadas.</li><li>Maior total aparece primeiro. Em empate, fica acima quem atingiu o total antes.</li><li>A posição mostrada antes do pagamento é uma estimativa e não fica reservada.</li><li>Estorno ou chargeback remove o valor confirmado do total auditável.</li></ol>
    <h2>2. Entrada e ultrapassagem</h2><p>Entrada mínima: R$ 19 no BR e US$ 5 no WORLD. Para ultrapassar uma posição, o total precisa excedê-la pelo incremento exibido. Um participante já verificado paga apenas o aumento necessário, não o total novamente.</p>
    <h2>3. O que o participante compra</h2><p>Presença patrocinada durante a temporada, página pública, posição correspondente ao total confirmado, card compartilhável e medição de cliques. A compra não garante vendas, seguidores, leads, lucro ou permanência em uma posição.</p>
    <h2>4. Cliques</h2><p>O redirecionamento é contado no servidor. Um identificador anônimo limita repetições por projeto em janelas de seis horas; agentes conhecidos de robôs e pré-visualizações são excluídos. “Clique válido” não significa pessoa única nem intenção de compra.</p>
    <h2>5. Conteúdo e remoção</h2><p>São recusados conteúdo adulto, apostas, armas, drogas, ódio, malware, phishing, pirâmides, alegações enganosas, compra de engajamento, encurtadores e links de afiliado. Dados e destino passam por validações antes da cobrança e por moderação contínua. A Instabid pode remover conteúdo ilegal, enganoso ou incompatível e, quando aplicável, processar reembolso.</p>
    <h2>6. Reembolsos</h2><p>Rejeição antes da publicação, duplicidade e erro comprovado devem ser reembolsados. Ser ultrapassado normalmente não gera reembolso. Indisponibilidade material e direitos obrigatórios do consumidor serão tratados conforme a lei aplicável e os termos finais do checkout.</p>
    <h2>English summary</h2><p>Confirmed boosts determine rank; ties favor the earlier total. Paid placement is always disclosed. Clicks are server-counted with repeat and bot filtering. No prize, sales, follower, or return guarantee is offered. BR Pix payments are processed by BravoPay.</p>
  </InfoPage>;
}
