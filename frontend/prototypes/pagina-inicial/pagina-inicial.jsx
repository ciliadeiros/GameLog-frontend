import { BotaoAuth } from "./BotaoAuth";
import bibliotecaExemplo from "./biblioteca-exemplo.png";
import detalhesExemplo from "./detalhes-exemplo.png";
import explorarExemplo from "./explorar-exemplo.png";
import imagemDeFundo from "./imagem-de-fundo.png";
import { LogoGamelog } from "./LogoGamelog";
import "./style.css";

export const PginaInicial = () => {
  return (
    <div className="pgina-inicial">
      <img
        className="imagem-de-fundo"
        alt="Imagem de fundo"
        src={imagemDeFundo}
      />
      <div className="gradiente-preto" />
      <div className="imagens">
        <div className="img">
          <div className="text-wrapper">Explore o catálogo</div>
          <img className="img-2" alt="Explorar exemplo" src={explorarExemplo} />
        </div>
        <div className="img">
          <div className="div">Organize sua biblioteca!</div>
          <img className="img-2" alt="Detalhes exemplo" src={detalhesExemplo} />
        </div>
        <div className="img">
          <p className="p">Veja os detalhes sobre o jogo</p>
          <img
            className="biblioteca-exemplo"
            alt="Biblioteca exemplo"
            src={bibliotecaExemplo}
          />
        </div>
      </div>
      <div className="botoes-auth">
        <BotaoAuth className="BOTAO-AUTH-instance" text="FAÇA LOG IN" />
        <BotaoAuth className="BOTAO-AUTH-instance" text="CADASTRE-SE" />
      </div>
      <div className="logo">
        <LogoGamelog className="logo-gamelog-1" />
      </div>
    </div>
  );
};
