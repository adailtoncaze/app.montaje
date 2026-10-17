import {
  Field,
  Input,
  makeStyles,
  tokens,
  type FieldProps,
  type InputProps,
} from '@fluentui/react-components';

const useClasses = makeStyles({
  campo: {
    rowGap: tokens.spacingVerticalXS,
  },
  entrada: {
    minHeight: '48px',
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase400,
    borderRadius: tokens.borderRadiusMedium,
  },
});

export interface CampoProps extends Omit<InputProps, 'size'> {
  rotulo: string;
  erro?: string;
  dica?: string;
  orientation?: FieldProps['orientation'];
}

/** Campo de texto rotulado, com altura de toque confortável. */
export function Campo({ rotulo, erro, dica, orientation, ...resto }: CampoProps) {
  const c = useClasses();
  return (
    <Field
      className={c.campo}
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
