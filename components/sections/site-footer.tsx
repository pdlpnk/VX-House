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
          <p>Закрытая платформа специальных условий, заданий и вознаграждений от партнёров.</p>
        </div>
        <nav aria-label="Дополнительная навигация">
          <a href="#responsibility">Пользовательское соглашение</a>
          <a href="#responsibility">Политика конфиденциальности</a>
          <a href="#responsible-use">Ответственное участие</a>
          <a href="#faq">Поддержка</a>
        </nav>
        <p className="site-footer__legal"><strong>18+</strong><span>VX House не принимает ставки, депозиты и не хранит игровой баланс.</span></p>
      </Container>
    </footer>
  );
}
