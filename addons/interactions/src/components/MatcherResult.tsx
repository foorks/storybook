import React from 'react';
import { Node } from './MethodCall';

const getParams = (line: string, fromIndex = 0) => {
  for (let i = fromIndex, depth = 1; i < line.length; i++) {
    if (line[i] === '(') depth++;
    else if (line[i] === ')') depth--;
    if (depth === 0) return line.slice(fromIndex, i);
  }
};

const parseValue = (value: string) => {
  try {
    return value === 'undefined' ? undefined : JSON.parse(value);
  } catch (e) {
    return value;
  }
};

export const Received = ({ value, parsed }: { value: any; parsed?: boolean }) =>
  parsed ? (
    <Node value={value} style={{ color: 'crimson' }} />
  ) : (
    <span style={{ color: 'crimson' }}>{value}</span>
  );

export const Expected = ({ value, parsed }: { value: any; parsed?: boolean }) =>{
  if (parsed) {
    if (typeof value === 'string' && value.startsWith('called with')) return value;
    return <Node value={value} style={{ color: 'green' }} />
  }
  return <span style={{ color: 'green' }}>{value}</span>
}

export const MatcherResult = ({ message }: { message: string }) => {
  const lines = message.split('\n');
  return (
    <pre style={{ margin: 0, padding: '8px 10px 8px 30px' }}>
      {lines.flatMap((line: string, index: number) => {
        if (line.startsWith('expect(')) {
          const received = getParams(line, 7);
          const remainderIndex = received && 7 + received.length;
          const matcher = received && line.slice(remainderIndex).match(/\.(to|last|nth)[A-Z]\w+\(/);
          if (matcher) {
            const expectedIndex = remainderIndex + matcher.index + matcher[0].length;
            const expected = getParams(line, expectedIndex);
            if (expected) {
              return [
                'expect(',
                <Received key={'received_' + received} value={received} />,
                line.slice(remainderIndex, expectedIndex),
                <Expected key={'expected_' + expected} value={expected} />,
                line.slice(expectedIndex + expected.length),
                <br key={'br' + index} />,
              ];
            }
          }
        }

        if (line.match(/^\s*- /)) {
          return [<Expected key={line + index} value={line} />, <br key={'br' + index} />];
        }
        if (line.match(/^\s*\+ /)) {
          return [<Received key={line + index} value={line} />, <br key={'br' + index} />];
        }

        const [, assertionLabel, assertionValue] = line.match(/^(Expected|Received): (.*)$/) || [];
        if (assertionLabel && assertionValue) {
          return assertionLabel === 'Expected'
            ? [
                'Expected: ',
                <Expected key={line + index} value={parseValue(assertionValue)} parsed />,
                <br key={'br' + index} />,
              ]
            : [
                'Received: ',
                <Received key={line + index} value={parseValue(assertionValue)} parsed />,
                <br key={'br' + index} />,
              ];
        }

        const [, prefix, numberOfCalls] =
          line.match(/(Expected number|Received number|Number) of calls: (\d+)$/i) || [];
        if (prefix && numberOfCalls) {
          return [
            `${prefix} of calls: `,
            <Node key={line + index} value={Number(numberOfCalls)} />,
            <br key={'br' + index} />,
          ];
        }

        const [, receivedValue] = line.match(/^Received has value: (.+)$/) || [];
        if (receivedValue) {
          return [
            'Received has value: ',
            <Node key={line + index} value={parseValue(receivedValue)} />,
            <br key={'br' + index} />,
          ];
        }

        return [<span key={line + index}>{line}</span>, <br key={'br' + index} />];
      })}
    </pre>
  );
};