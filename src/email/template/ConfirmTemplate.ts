import { host } from "../../configs";
import { MailManagerOptions } from "../MailManager";

function ConfirmTemplate(mail: string, link: string): MailManagerOptions {
  const root = host.DOMAIN;

  return {
    to: mail,
    subject: "Регистрация на Chesswood",
    tags: ["chesswood", "signup"],
    html: `<style>
    body {
      margin: 0;
      padding: 0;
    }
    .card {
      background: #15232e;
      color: #fff;
      padding: 40px 20px;
      width: 100%;
      display: block;
      text-align: center;
    }
    .card__header {
      color: #fff;
      margin: 20px 0;
    }
    .link-lg {
      background: #01a3e0;
      border-bottom-color: rgb(255, 255, 255);
      border-bottom-style: solid;
      border-bottom-width: 1px;
      border-radius: 5px;
      border-top-color: #80d6f7;
      border-top-style: solid;
      border-top-width: 1px;
      color: #fff;
      font-size: 20px;
      padding: 10px 20px 10px 20px;
      text-decoration: none;
      text-transform: uppercase;
      transition: all 200ms;
    }
    .link-lg:hover {
      background: #0290c4;
    }
  </style>
  <div class="card">
    <a href="${root}">
      <img
        src="https://chesswood.online/preview_board_3d.png"
        alt="logo"
        height="128"
      />
    </a>
    <h3 class="card__header">
      С помощью вашего аккаунта была произвендена регистрация.
    </h3>
    <p>Для подтверждения регистрации нажмите</p>
    <a class="link-lg" href="https://${root}${link}">Подтвердить</a>
    <p>Если это были не Вы проигнорируйте это сообщение!</p>
  </div>`,
  };
}

export default ConfirmTemplate;
