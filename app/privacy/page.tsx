import type { Metadata } from 'next';
import { InfoPage } from '@/components/InfoPage';

export const metadata: Metadata = { title: 'Privacidade — Instabid', description: 'Resumo de privacidade do piloto Instabid.' };

export default function PrivacyPage() {
  return <InfoPage eyebrow="Privacidade · Privacy" title="Coletar o mínimo. Explicar o necessário." lead="Este resumo descreve o piloto pago do Instabid e os dados necessários para operar o ranking.">
    <h2>Dados enviados</h2><p>Nome do projeto, perfil público, categoria, link de destino, e-mail de contato e valor do boost. No checkout Pix também são solicitados nome do pagador e CPF ou CNPJ para processamento e prevenção a fraude.</p>
    <h2>Medição de cliques</h2><p>O redirecionamento usa um cookie estritamente necessário com identificador aleatório. O identificador é transformado em hash por projeto e janela de seis horas para limitar cliques repetidos. Não armazenamos o IP bruto nessa medição.</p>
    <h2>Recuperação do checkout</h2><p>Enquanto houver um Pix pendente, o navegador guarda somente o identificador técnico da cobrança para permitir que o usuário feche a janela e acompanhe o pagamento depois no mesmo dispositivo. O identificador é removido quando a cobrança é confirmada, falha ou é estornada.</p>
    <h2>Pagamentos</h2><p>O Pix é processado pela BravoPay. A Instabid não armazena CPF/CNPJ do pagador em seu banco; guarda apenas identificadores da cobrança, valor, status, código Pix e registros necessários para confirmação e auditoria.</p>
    <h2>Retenção e direitos</h2><p>Registros de cobrança e antifraude são mantidos pelo tempo necessário para cumprir obrigações, resolver disputas e prevenir duplicidade. O titular poderá solicitar acesso, correção ou exclusão pelo canal oficial publicado no site e nos perfis do projeto.</p>
    <h2>Fornecedores e transferências</h2><p>Hospedagem, banco, pagamentos e mensuração podem operar dados em infraestrutura de terceiros. Para pagamentos no Brasil, a BravoPay atua como processadora dos dados enviados no checkout.</p>
    <h2>English summary</h2><p>The pilot stores project data and payment references, while BravoPay processes Brazilian Pix payer data. Instabid does not retain payer tax IDs in its own database. A strictly necessary anonymous cookie is used to deduplicate clicks.</p>
  </InfoPage>;
}
