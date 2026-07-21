import Image from "next/image";

import { Container } from "@/components/container";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="site-footer__layout">
        <div className="site-footer__brand">
          <span className="brand-logo brand-logo--footer" aria-hidden="true">
            <Image src="/vx-house-logo.jpg" alt="" width={232} height={232} unoptimized />
          </span>
          <p>Платформа лояльности и сотрудничества для совершеннолетних пользователей.</p>
        </div>
        <nav aria-label="Дополнительная навигация">
          <a href="#model">О платформе</a>
          <a href="#responsible-use">Ответственное использование</a>
          <a href="#privacy">Приватность</a>
          <a href="#faq">Вопросы</a>
        </nav>
        <p className="site-footer__legal">18+ · Турция и Азербайджан · Доступность условий зависит от страны и подтверждается отдельно.</p>
      </Container>
    </footer>
  );
}
