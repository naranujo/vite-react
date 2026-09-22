import { Box, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import type { ConfusionMatrix as CM } from '../../types/training';
import type { TargetRepresentation } from '../../types/dataset';
import { classNames } from '../../lib/featureEngineering';

interface Props {
  matrix: CM;
  representation: TargetRepresentation;
}

/** Intensidad de fondo proporcional al valor (para legibilidad). */
function cellBg(value: number, max: number, correct: boolean): string {
  const t = max > 0 ? value / max : 0;
  const base = correct ? [31, 78, 121] : [198, 89, 17];
  const alpha = 0.08 + t * 0.55;
  return `rgba(${base[0]}, ${base[1]}, ${base[2]}, ${alpha})`;
}

export function ConfusionMatrixView({ matrix, representation }: Props) {
  const [neg, pos] = classNames(representation);
  const max = Math.max(
    matrix.truePositive,
    matrix.trueNegative,
    matrix.falsePositive,
    matrix.falseNegative,
    1,
  );

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Matriz de confusion
      </Typography>
      <Table
        size="small"
        sx={{ maxWidth: 380, '& td, & th': { textAlign: 'center' } }}
      >
        <TableBody>
          <TableRow>
            <TableCell />
            <TableCell colSpan={2}>
              <Typography variant="caption" color="text.secondary">
                Prediccion
              </Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell />
            <TableCell>
              <strong>{neg}</strong>
            </TableCell>
            <TableCell>
              <strong>{pos}</strong>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Typography variant="caption" color="text.secondary">
                Real {neg}
              </Typography>
            </TableCell>
            <TableCell
              sx={{ bgcolor: cellBg(matrix.trueNegative, max, true) }}
            >
              {matrix.trueNegative}
            </TableCell>
            <TableCell
              sx={{ bgcolor: cellBg(matrix.falsePositive, max, false) }}
            >
              {matrix.falsePositive}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Typography variant="caption" color="text.secondary">
                Real {pos}
              </Typography>
            </TableCell>
            <TableCell
              sx={{ bgcolor: cellBg(matrix.falseNegative, max, false) }}
            >
              {matrix.falseNegative}
            </TableCell>
            <TableCell
              sx={{ bgcolor: cellBg(matrix.truePositive, max, true) }}
            >
              {matrix.truePositive}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
}
