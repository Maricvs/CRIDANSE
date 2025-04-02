import React from "react";
import WelcomeIntroBlock from "./WelcomeIntroBlock";
import DevBanner from "./DevBanner";
import ChatField from "./ChatField";

const Home: React.FC = () => {
  return (
    <main>
        <DevBanner />
      <WelcomeIntroBlock />
      <ChatField />
    </main>
  );
};

export default Home;