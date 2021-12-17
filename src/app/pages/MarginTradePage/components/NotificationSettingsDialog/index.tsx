import React, { useCallback, useState, useEffect } from 'react';
import { Dialog } from 'app/containers/Dialog/Loadable';
import { Trans, useTranslation } from 'react-i18next';
import { translations } from '../../../../../locales/i18n';
import { Switch } from '@blueprintjs/core/lib/esm/components/forms/controls';
import { Input } from 'app/components/Form/Input';
import { FormGroup } from 'app/components/Form/FormGroup';
import { DialogButton } from 'app/components/Form/DialogButton';
import imgTelegram from 'assets/images/marginTrade/Telegram_logo.svg';
import imgDiscord from 'assets/images/marginTrade/Discord-Logo-Color.svg';
import imgEmail from 'assets/images/marginTrade/email.png';
import axios from 'axios';
import { useAccount } from 'app/hooks/useAccount';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../slice';
import { selectMarginTradePage } from '../../selectors';
import { parseJwt } from 'utils/helpers';
import { walletService } from '@sovryn/react-wallet';
import { Toast } from 'app/components/Toast';

interface INotificationSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsDialog: React.FC<INotificationSettingsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  // const url = backendUrl[currentChainId];
  const url = 'https://notify.test.sovryn.app/';
  const { t } = useTranslation();
  const account = useAccount();
  const dispatch = useDispatch();
  const { notificationToken, notificationUser } = useSelector(
    selectMarginTradePage,
  );
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [isEmailActive, setIsEmailActive] = useState(false);
  const [isTelegramActive, setIsTelegramActive] = useState(false);
  const [isDiscordActive, setIsDiscordActive] = useState(false);

  const onChangeEmailSwitch = useCallback(
    () => setIsEmailActive(prevValue => !prevValue),
    [],
  );
  const onChangeTelegramSwitch = useCallback(
    () => setIsTelegramActive(prevValue => !prevValue),
    [],
  );

  const onChangeDiscordSwitch = useCallback(
    () => setIsDiscordActive(prevValue => !prevValue),
    [],
  );

  useEffect(() => {
    if (isOpen && !notificationToken) {
      getToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (notificationToken && isOpen && !notificationUser) {
      getUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationToken, isOpen, notificationUser]);

  useEffect(() => {
    if (!isOpen) {
      resetForm(notificationUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const getToken = () => {
    if (!account) return;
    const newUser = false;
    const timestamp = new Date();
    const message = `Login to backend on ${timestamp}`;
    walletService.signMessage(message).then(signedMessage => {
      axios
        .post(url + 'user/' + (newUser ? 'register' : 'auth'), {
          signedMessage,
          message,
          walletAddress: account,
        })
        .then(res => {
          if (res.data && res.data.token) {
            dispatch(actions.setNotificationToken(res.data.token));
          }
        })
        .catch(e => {
          console.log(e);
        });
    });
  };

  const getUser = () => {
    if (!account || !notificationToken) return;
    const userId = parseJwt(notificationToken)?.sub;
    if (!userId) return;
    setLoading(true);
    axios
      .get(url + 'user/' + userId, {
        headers: {
          Authorization: 'bearer ' + notificationToken,
        },
      })
      .then(res => {
        if (res.data) {
          dispatch(actions.setNotificationUser(res.data));
          resetForm(res.data);
        }
      })
      .catch(error => {
        console.log(error);
        if (error?.response?.status === 401) {
          getToken();
        }
      })
      .finally(() => setLoading(false));
  };

  const updateUser = () => {
    if (!account || !notificationToken) return;
    const userId = parseJwt(notificationToken)?.sub;
    if (!userId) return;
    setLoading(true);
    axios
      .put(
        url + 'user/' + account,
        {
          walletAddress: account,
          email,
          telegramHandle: telegramUsername,
          discordHandle: discordUsername,
          isEmailNotifications: isEmailActive,
          isDiscordNotifications: isDiscordActive,
          isTelegramNotifications: isTelegramActive,
        },
        {
          headers: {
            Authorization: 'bearer ' + notificationToken,
          },
        },
      )
      .then(res => {
        if (res.data) {
          dispatch(actions.setNotificationUser(res.data));
          resetForm(res.data);
        }
        Toast(
          'success',
          <div className="tw-flex">
            <Trans
              i18nKey={
                translations.marginTradePage.notificationSettingsDialog
                  .updateSuccess
              }
            />
          </div>,
        );
      })
      .catch(error => {
        console.log(error);
        if (error?.response?.status === 401) {
          getToken();
        }
      })
      .finally(() => setLoading(false));
  };

  const resetForm = user => {
    setDiscordUsername(user?.discordHandle || '');
    setIsDiscordActive(!!user?.isDiscordNotifications);
    setTelegramUsername(user?.telegramHandle || '');
    setIsTelegramActive(!!user?.isTelegramNotifications);
    setEmail(user?.email || '');
    setIsEmailActive(!!user?.isEmailNotifications);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="tw-mx-auto tw-w-full tw-mw-340">
        <div className="tw-mb-6 tw-text-center tw-font-semibold tw-text-lg">
          {t(translations.marginTradePage.notificationSettingsDialog.title)}
        </div>

        <div className="tw-mb-6 tw-text-sm">
          {t(translations.marginTradePage.notificationSettingsDialog.notifyVia)}
          :
        </div>

        <div className="tw-mb-8">
          <div className="tw-flex tw-justify-between tw-mb-2">
            <div className="tw-flex tw-items-center">
              <img
                src={imgEmail}
                alt="Email"
                width="24"
                className="tw-mr-1.5 tw-w-5"
              />
              Email
            </div>
            <Switch
              checked={isEmailActive}
              onChange={onChangeEmailSwitch}
              large
              className="tw-mb-0"
            />
          </div>

          <FormGroup
            label={`${t(
              translations.marginTradePage.notificationSettingsDialog
                .emailHandle,
            )}:`}
            className={
              !isEmailActive
                ? 'tw-pointer-events-none tw-opacity-30 tw-cursor-not-allowed'
                : ''
            }
            labelClassName="tw-text-sm tw-font-normal tw-mb-2"
          >
            <Input
              value={email}
              onChange={setEmail}
              placeholder={t(
                translations.marginTradePage.notificationSettingsDialog
                  .emailPlaceholder,
              )}
              className="tw-rounded-lg tw-h-8"
              inputClassName="tw-font-medium"
            />
          </FormGroup>
        </div>

        <div className="tw-mb-8">
          <div className="tw-flex tw-justify-between tw-mb-2">
            <div className="tw-flex tw-items-center">
              <img
                src={imgTelegram}
                alt="Telegram logo"
                className="tw-mr-1.5"
              />
              Telegram
            </div>
            <Switch
              checked={isTelegramActive}
              onChange={onChangeTelegramSwitch}
              large
              className="tw-mb-0"
            />
          </div>

          <FormGroup
            label={`${t(
              translations.marginTradePage.notificationSettingsDialog
                .telegramHandle,
            )}:`}
            className={
              !isTelegramActive
                ? 'tw-pointer-events-none tw-opacity-30 tw-cursor-not-allowed'
                : ''
            }
            labelClassName="tw-text-sm tw-font-normal tw-mb-2"
          >
            <Input
              value={telegramUsername}
              onChange={setTelegramUsername}
              placeholder={t(
                translations.marginTradePage.notificationSettingsDialog
                  .usernamePlaceholder,
              )}
              className="tw-rounded-lg tw-h-8"
              inputClassName="tw-font-medium"
            />
          </FormGroup>
        </div>

        <div className="tw-mb-6">
          <div className="tw-flex tw-justify-between tw-mb-2">
            <div className="tw-flex tw-items-center">
              <img src={imgDiscord} alt="Discord logo" className="tw-mr-1.5" />
              Discord
            </div>
            <Switch
              checked={isDiscordActive}
              onChange={onChangeDiscordSwitch}
              large
              className="tw-mb-0"
            />
          </div>

          <FormGroup
            label={`${t(
              translations.marginTradePage.notificationSettingsDialog
                .discordHandle,
            )}:`}
            className={
              !isDiscordActive
                ? 'tw-pointer-events-none tw-opacity-30 tw-cursor-not-allowed'
                : ''
            }
            labelClassName="tw-text-sm tw-font-normal tw-mb-2"
          >
            <Input
              value={discordUsername}
              onChange={setDiscordUsername}
              placeholder={t(
                translations.marginTradePage.notificationSettingsDialog
                  .usernamePlaceholder,
              )}
              className="tw-rounded-lg tw-h-8"
              inputClassName="tw-font-medium"
            />
          </FormGroup>
        </div>

        <div className="tw-text-sm">
          {t(
            translations.marginTradePage.notificationSettingsDialog
              .receiveNotificationTitle,
          )}
          :
          <div className="tw-mt-3">
            <div>
              -{' '}
              {t(
                translations.marginTradePage.notificationSettingsDialog
                  .notificationEvents[1],
              )}
            </div>

            <div>
              -{' '}
              {t(
                translations.marginTradePage.notificationSettingsDialog
                  .notificationEvents[2],
              )}
            </div>
          </div>
        </div>

        <DialogButton
          confirmLabel={t(
            translations.marginTradePage.notificationSettingsDialog.submit,
          )}
          onConfirm={() => updateUser()}
          disabled={loading || !notificationToken}
          className="tw-rounded-lg tw-mt-6"
        />
      </div>
    </Dialog>
  );
};
