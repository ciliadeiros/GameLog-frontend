import { BotaoAuth } from "./BotaoAuth";
import image from "./image.png";
import imagemDeFundo from "./imagem-de-fundo.png";
import img1 from "./img-1.png";
import img2 from "./img-2.png";
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
      <div className="frame">
        <img className="img" alt="Img" src={img1} />
        <img className="img" alt="Img" src={img2} />
        <img className="img-2" alt="Img" src={image} />
      </div>
      <div className="div">
        <BotaoAuth className="BOTAO-AUTH-instance" text="CADASTRE-SE" />
        <LogoGamelog className="logo-gamelog-1" />
        <BotaoAuth
          className="design-component-instance-node"
          text="FAÇA LOG IN"
        />
      </div>
      <div className="frame-2">
        <div className="text-wrapper">Explore o catálogo</div>
        <p className="text-wrapper">Veja os detalhes sobre o jogo</p>
        <div className="text-wrapper-2">Organize sua biblioteca!</div>
      </div>
    </div>
  );
};
