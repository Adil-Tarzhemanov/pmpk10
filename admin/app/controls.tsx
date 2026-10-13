"use client";

/**
 * Две мелочи, которым нужен браузер. Остальная админка работает без
 * JavaScript, а эти без него просто не спрашивают и не проверяют.
 */

/** Кнопка, которая переспрашивает: удаление на сайте не отменить кнопкой «назад» */
export function ConfirmButton({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className="btn btn--danger"
      type="submit"
      onClick={(event) => {
        if (!window.confirm(question)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

/**
 * Поле файла, которое не даёт отправить слишком большой файл. Запрос
 * больше предела сервер отбрасывает раньше, чем код админки успеет
 * объяснить, в чём дело, — поэтому проверяем ещё до отправки.
 */
export function FileField({
  id,
  name,
  accept,
  maxBytes,
  required,
}: {
  id: string;
  name: string;
  accept: string;
  maxBytes: number;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      name={name}
      type="file"
      accept={accept}
      required={required}
      onChange={(event) => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        const tooBig = file !== undefined && file.size > maxBytes;
        input.setCustomValidity(
          tooBig ? `Файл больше ${Math.round(maxBytes / 1024 / 1024)} МБ. Уменьшите его и выберите снова.` : "",
        );
        if (tooBig) input.reportValidity();
      }}
    />
  );
}

/** Сообщение об ошибке сохранения: текст подбирает lib/save.ts */
export function ErrorMessage({ text }: { text: string }) {
  return (
    <p className="msg msg--err" role="alert">
      {text}
    </p>
  );
}
