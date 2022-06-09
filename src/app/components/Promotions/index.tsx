import React from 'react';
import { PromotionsCarousel } from './components/PromotionsCarousel';
import { AppSection, PromotionColor } from './components/PromotionCard/types';
import { PromotionCard } from './components/PromotionCard';
import { Asset } from 'types';
import { useTranslation } from 'react-i18next';
import { translations } from 'locales/i18n';
import { LiquidityPoolDictionary } from 'utils/dictionaries/liquidity-pool-dictionary';
import styles from './index.module.scss';
import { learnMoreLending, learnMoreYieldFarming } from 'utils/classifiers';

export const Promotions: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="tw-my-14 tw-border-b tw-border-solid tw-border-sov-white">
      <div className={styles.title}>
        {t(translations.landingPage.promotions.title)}
      </div>

      <div className="tw-relative tw-mb-8">
        <PromotionsCarousel>
          <PromotionCard
            appSection={AppSection.YieldFarm}
            backgroundColor={PromotionColor.Orange}
            title={t(translations.promotions.card1.title)}
            duration={t(translations.promotions.card1.duration)}
            text={t(translations.promotions.card1.text)}
            learnMoreLink={learnMoreYieldFarming}
            logoAsset1={Asset.MYNT}
            logoAsset2={Asset.RBTC}
            linkAsset={LiquidityPoolDictionary.get(Asset.MYNT, Asset.RBTC)?.key}
            linkDataActionId={`landing-promo-learnmore-${Asset.MYNT}`}
          />
          <PromotionCard
            appSection={AppSection.Lend}
            backgroundColor={PromotionColor.Yellow}
            title={t(translations.promotions.card2.title)}
            duration={t(translations.promotions.card2.duration)}
            text={t(translations.promotions.card2.text)}
            linkAsset={Asset.XUSD}
            learnMoreLink={learnMoreLending}
            logoAsset1={Asset.XUSD}
            linkDataActionId={`landing-lend-promo-learnmore-${Asset.XUSD}`}
          />
          <PromotionCard
            appSection={AppSection.YieldFarm}
            backgroundColor={PromotionColor.Yellow}
            title={t(translations.promotions.card3.title)}
            duration={t(translations.promotions.card3.duration)}
            text={t(translations.promotions.card3.text)}
            learnMoreLink={learnMoreYieldFarming}
            logoAsset1={Asset.XUSD}
            logoAsset2={Asset.RBTC}
            linkAsset={LiquidityPoolDictionary.get(Asset.XUSD, Asset.RBTC)?.key}
            linkDataActionId={`landing-promo-learnmore-${Asset.XUSD}`}
          />
          <PromotionCard
            appSection={AppSection.YieldFarm}
            backgroundColor={PromotionColor.Purple}
            title={t(translations.promotions.card4.title)}
            duration={t(translations.promotions.card4.duration)}
            text={t(translations.promotions.card4.text)}
            learnMoreLink={learnMoreYieldFarming}
            logoAsset1={Asset.SOV}
            logoAsset2={Asset.RBTC}
            linkAsset={LiquidityPoolDictionary.get(Asset.SOV, Asset.RBTC)?.key}
            linkDataActionId={`landing-promo-learnmore-${Asset.SOV}`}
          />
          <PromotionCard
            appSection={AppSection.YieldFarm}
            backgroundColor={PromotionColor.Green}
            title={t(translations.promotions.card5.title)}
            duration={t(translations.promotions.card5.duration)}
            text={t(translations.promotions.card5.text)}
            learnMoreLink={learnMoreYieldFarming}
            logoAsset1={Asset.ETH}
            logoAsset2={Asset.RBTC}
            linkAsset={LiquidityPoolDictionary.get(Asset.ETH, Asset.RBTC)?.key}
            linkDataActionId={`landing-promo-learnmore-${Asset.ETH}`}
          />
        </PromotionsCarousel>
      </div>
    </div>
  );
};
