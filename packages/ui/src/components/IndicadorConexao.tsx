import { Badge, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { Wifi120Filled, WifiOff20Regular } from '@fluentui/react-icons';
import { useEffect, useState } from 'react';

const useClasses = makeStyles({
  chip: {
    fontWeight: tokens.fontWeightSemibold,
    borderRadius: tokens.borderRadiusMedium,
  },
  offline: {
    color: tokens.colorPaletteYellowForeground1,
    border: `1px solid ${tokens.colorPaletteYellowBorder2}`,
  },
  // Verde sem borda: visual mais leve e elegante.
  online: {
    color: tokens.colorPaletteGreenForeground1,
  },
});

export interface IndicadorConexaoProps {
  /** Mostra também o estado conectado (padrão: true). */
  mostrarOnline?: boolean;
  className?: string;
}

/**
 * Chip de estado da conexão (online/offline) baseado em `navigator.onLine`
 * e nos eventos `online`/`offline`. Reativo para o fluxo offline-first.
 *
 * Sempre exibe, ao lado do nome, um ícone de conexão: wi-fi quando conectado
 * e wi-fi cortado quando sem conexão (tamanho 20px, proporcional ao badge).
 */
export function IndicadorConexao({ mostrarOnline = true, className }: IndicadorConexaoProps) {
  const c = useClasses();
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const ficouOnline = () => setOnline(true);
    const ficouOffline = () => setOnline(false);
    window.addEventListener('online', ficouOnline);
    window.addEventListener('offline', ficouOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', ficouOnline);
      window.removeEventListener('offline', ficouOffline);
    };
  }, []);

  if (online && !mostrarOnline) return null;

  return (
    <Badge
      appearance="tint"
      color={online ? 'success' : 'warning'}
      size="medium"
      icon={online ? <Wifi120Filled /> : <WifiOff20Regular />}
      className={mergeClasses(c.chip, online ? c.online : c.offline, className)}
      title={online ? 'Conectado à internet' : 'Sem conexão — os dados serão enviados quando voltar'}
      aria-live="polite"
    >
      {online ? 'Online' : 'Sem conexão'}
    </Badge>
  );
}
