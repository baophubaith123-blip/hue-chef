import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/FileUpload';
import { useAppeals } from '@/contexts/AppealContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMail } from '@/contexts/MailContext';
import { useSupport } from '@/contexts/SupportContext';
import type { AppealType, ChatAttachment, ChatMessage } from '@/features/support/types';
import { useTranslation } from '@/i18n/useTranslation';
import { AppError } from '@/lib/errors';

import styles from '@/features/support/components/SupportChat.module.css';

interface SupportChatProps {
  threadId: string;
  showCreateAppeal?: boolean;
}

export function SupportChat({ threadId, showCreateAppeal = false }: SupportChatProps) {
  const { t, dict } = useTranslation();
  const { user } = useAuth();
  const { getThread, getMessages, sendMessage, markThreadRead, findUserById } = useSupport();
  const { createAppealFromThread } = useAppeals();
  const { sendSupportMail } = useMail();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [appealType, setAppealType] = useState<AppealType>('ban');
  const [appealSummary, setAppealSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const thread = useMemo(() => getThread(threadId), [threadId, getThread, refreshKey]);
  const messages = useMemo(
    () => getMessages(threadId),
    [threadId, getMessages, refreshKey],
  );

  useEffect(() => {
    if (user) markThreadRead(threadId, user.id);
  }, [threadId, user, markThreadRead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      if (!user) return;
      try {
        const attachments = attachment ? [attachment] : [];
        const msg = sendMessage(threadId, user.id, text, attachments);
        void msg;
        setText('');
        setAttachment(null);
        setRefreshKey((k) => k + 1);
        if (messages.length === 0 && text.trim()) {
          const otherParticipant = thread?.participantIds.find((id) => id !== user.id);
          if (otherParticipant && user.role === 'support') {
            sendSupportMail(otherParticipant, '', dict.mail.supportReplyBody, {
              threadId,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [
      attachment,
      dict.mail.supportReplyBody,
      messages.length,
      sendMessage,
      sendSupportMail,
      text,
      thread,
      threadId,
      user,
    ],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      form?.requestSubmit();
    }
  };

  const onCreateAppeal = useCallback(() => {
    setError(null);
    setSuccess(null);
    try {
      if (!thread) throw new AppError('Thread not found', 'THREAD_NOT_FOUND');
      if (!appealSummary.trim()) throw new AppError('Need summary', 'REQUIRED');
      if (!user) throw new AppError('Not logged in', 'AUTH');
      const appellantId =
        thread.participantIds.find((id) => id !== user.id) ?? thread.participantIds[0];
      const appeal = createAppealFromThread({
        threadId: thread.id,
        appellantId,
        type: appealType,
        subject: `${dict.support.typeLabels[appealType]}: ${appealSummary.slice(0, 50)}`,
        summary: appealSummary.trim(),
        supportId: user.role === 'support' ? user.id : undefined,
      });
      sendSupportMail(
        appellantId,
        `Tạo khiếu nại mới: ${dict.support.typeLabels[appealType]}`,
        `Nhân viên hỗ trợ đã tạo khiếu nại cho bạn:\n${appeal.summary}\n\nQuản trị viên sẽ xem xét và trả lời trong thời gian sớm nhất.`,
        { appealId: appeal.id, threadId: appeal.threadId },
      );
      setSuccess(t('support.appealCreated'));
      setAppealSummary('');
    } catch (err) {
      if (err instanceof AppError && err.code === 'REQUIRED') {
        setError('Vui lòng mô tả tóm tắt khiếu nại.');
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, [
    appealSummary,
    appealType,
    createAppealFromThread,
    dict.support.typeLabels,
    sendSupportMail,
    t,
    thread,
    user,
  ]);

  if (!thread) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>{t('support.chatEmpty')}</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.chatHeader}>
        <div>
          <h3 className={styles.title}>{thread.subject}</h3>
          <p className={styles.sub}>
            {thread.closed ? '🔒 Đã đóng' : `● ${messages.length} tin nhắn`}
          </p>
        </div>
      </header>

      <div className={styles.messages} ref={scrollRef} role="log">
        {messages.length === 0 ? (
          <p className={styles.placeholder}>{t('support.chatHint')}</p>
        ) : (
          messages.map((msg) => <ChatBubble key={msg.id} msg={msg} findUser={findUserById} meId={user?.id} />)
        )}
      </div>

      <form className={styles.composer} onSubmit={onSubmit}>
        {attachment ? null : (
          <FileUpload
            compact
            value={attachment}
            onChange={setAttachment}
            hint={t('fileUpload.hint')}
          />
        )}
        <textarea
          className={styles.input}
          rows={2}
          value={text}
          placeholder={t('support.chatPlaceholder')}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={thread.closed}
        />
        <div className={styles.composerActions}>
          {attachment ? (
            <div className={styles.attachBadge}>
              📎 {attachment.name}
              <button
                type="button"
                className={styles.removeAttach}
                onClick={() => setAttachment(null)}
                aria-label="Remove attachment"
              >
                ×
              </button>
            </div>
          ) : null}
          <Button type="submit" disabled={!text.trim() && !attachment || thread.closed}>
            {t('common.send')} →
          </Button>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
      </form>

      {showCreateAppeal ? (
        <section className={styles.appealSection}>
          <h4 className={styles.sectionTitle}>🛠 {t('support.createAppealFromThread')}</h4>
          <div className={styles.appealRow}>
            <label className={styles.fieldLabel} htmlFor="appealType">
              Loại
            </label>
            <select
              id="appealType"
              className={styles.select}
              value={appealType}
              onChange={(e) => setAppealType(e.target.value as AppealType)}
            >
              {(['ban', 'warning', 'account', 'recipe', 'other'] as AppealType[]).map((key) => (
                <option key={key} value={key}>
                  {dict.support.typeLabels[key]}
                </option>
              ))}
            </select>
          </div>
          <label className={styles.fieldLabel} htmlFor="appealSummary">
            Tóm tắt vấn đề
          </label>
          <textarea
            id="appealSummary"
            rows={3}
            className={styles.textarea}
            value={appealSummary}
            placeholder="Mô tả tóm tắt khiếu nại này…"
            onChange={(e) => setAppealSummary(e.target.value)}
          />
          <div className={styles.appealActions}>
            <Button type="button" variant="primary" onClick={onCreateAppeal}>
              + {t('support.createAppealFromThread')}
            </Button>
          </div>
          {success ? <div className={styles.success}>{success}</div> : null}
        </section>
      ) : null}
    </div>
  );
}

function ChatBubble({
  msg,
  findUser,
  meId,
}: {
  msg: ChatMessage;
  findUser: (id: string) => { name: string; avatar?: string } | undefined;
  meId?: string;
}) {
  const sender = findUser(msg.senderId);
  const isMe = msg.senderId === meId;
  return (
    <div className={`${styles.bubbleWrap} ${isMe ? styles.me : styles.them}`}>
      {sender?.avatar ? (
        <img src={sender.avatar} alt={sender.name} className={styles.senderAvatar} />
      ) : (
        <div className={styles.senderAvatar}>{(sender?.name ?? '?').charAt(0)}</div>
      )}
      <div className={`${styles.bubble} ${isMe ? styles.meBubble : styles.themBubble}`}>
        <div className={styles.senderName}>{sender?.name ?? msg.senderId}</div>
        {msg.content ? <p className={styles.msgText}>{msg.content}</p> : null}
        {msg.attachments.length > 0 ? (
          <ul className={styles.attachments}>
            {msg.attachments.map((att) => (
              <li key={att.id}>
                {att.type.startsWith('image/') ? (
                  <img src={att.dataUrl} alt={att.name} className={styles.attachImg} />
                ) : (
                  <a className={styles.attachLink} href={att.dataUrl} download={att.name}>
                    📎 {att.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : null}
        <div className={styles.msgTime}>
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
