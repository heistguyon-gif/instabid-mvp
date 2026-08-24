import type { Metadata } from 'next';
import { InfoPage } from '@/components/InfoPage';

export const metadata: Metadata = { title: 'Sobre — Instabid', description: 'Por que o Instabid existe e como o piloto será validado.' };

export default function AboutPage() {
  return <InfoPage eyebrow="Sobre · About" title="Uma disputa pública por atenção que precisa provar valor." lead="O ranking é o mecanismo. O produto é exposição patrocinada transparente, tráfego mensurável e uma história que o participante queira compartilhar.">
    <h2>Por que existe</h2><p>Diretórios tradicionais escondem preço, distribuição e desempenho. O Instabid torna públicos o valor, a posição e os cliques filtrados para que participantes e visitantes entendam exatamente o que está acontecendo.</p>
    <h2>Como será validado</h2><p>O piloto começa com uma plataforma e dois mercados separados: BR em português e BRL; WORLD em inglês e USD. Não misturamos moedas ou posições. O produto só avança para pagamentos se houver candidatos qualificados, intenção real de pagar, cliques relevantes e aprovação do processador.</p>
    <h2>O que não somos</h2><p>Não somos afiliados ao Instagram ou à Meta. Valor pago não é recomendação editorial nem prova de qualidade. Não vendemos seguidores ou engajamento artificial e não usamos automações não oficiais.</p>
    <h2>English summary</h2><p>Instabid is a transparent sponsored-discovery pilot with separate BR and WORLD markets. Paid rank is not an endorsement. The project is not affiliated with Instagram or Meta.</p>
  </InfoPage>;
}
