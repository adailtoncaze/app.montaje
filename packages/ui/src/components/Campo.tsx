import {
  Field,
  Input,
  makeStyles,
  tokens,
  type FieldProps,
  type InputProps,
} from '@fluentui/react-components';

const useClasses = makeStyles({
  entrada: {
    minHeight: '48px',
    fontSize: tokens.fontSizeBase400,
  },
});

export interface CampoProps extends Omit<InputProps, 'size'> {
  rotulo: string;
  erro?: string;
  dica?: string;
  orientation?: FieldProps['orientation'];
}

/** Campo de texto rotulado seguindo o design system do Teams. */
export function Campo({ rotulo, erro, dica, orientation, ...resto }: CampoProps) {
  const c = useClasses();
  return (
    <Field
      label={rotulo}
      hint={dica}
      validationMessage={erro}
      validationState={erro ? 'error' : 'none'}
      orientation={orientation}
      required={resto.required}
    >
      <Input {...resto} className={c.entrada} />
    </Field>
  );
}
