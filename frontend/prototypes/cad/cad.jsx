import { BotaoAuth } from "./BotaoAuth";
import imgGameCatalog2 from "./img-game-catalog-2.png";
import { Logo } from "./Logo";
import "./style.css";

export const CadastroDeUsu = () => {
  return (
    <div className="cadastro-de-usu">
      <img
        className="img-game-catalog"
        alt="Img game catalog"
        src={imgGameCatalog2}
      />
      <div className="content">
        <div className="titulo">CADASTRE-SE</div>
        <div className="input">
          <div className="text-wrapper">Nome Completo:</div>
          <div className="div-wrapper">
            <div className="div">Digite:</div>
          </div>
        </div>
        <div className="input-2">
          <div className="BOTAO-AUTH-2">
            <div className="div">Digite:</div>
          </div>
          <div className="text-wrapper-2">Nome de Usuário:</div>
        </div>
        <div className="input-2">
          <div className="BOTAO-AUTH-2">
            <div className="div">Digite:</div>
          </div>
          <div className="text-wrapper-3">E-mail:</div>
        </div>
        <div className="input-2">
          <div className="BOTAO-AUTH-2">
            <div className="div">Digite:</div>
          </div>
          <div className="text-wrapper-4">Senha:</div>
        </div>
        <BotaoAuth
          className="BOTAO-DE-CADASTRAR"
          divClassName="BOTAO-AUTH-instance"
          text="CADASTRAR"
        />
        <p className="link">Já possui cadastro? Clique aqui e faça log in!</p>
      </div>
      <Logo className="logo-instance" />
    </div>
  );
};
