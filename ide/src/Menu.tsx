// TODO (michael): improve accessibilty by enabling these rules
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { MenuItems } from './menu-types';
import { State, EditorMode } from './state';
import { Action } from './action';
import FSBrowser from './FSBrowser';
import FontSize from './FontSize';

type StateProps = {
  menuItems: MenuItems,
  menuTabVisible: false | number,
  debugBorders: boolean,
  displayResultsInline: boolean,
  editorMode: EditorMode,
  currentFileContents: string | undefined,
};

function mapStateToProps(state: State): StateProps {
  const {
    menuItems,
    menuTabVisible,
    debugBorders,
    displayResultsInline,
    editorMode,
    currentFileContents,
  } = state;

  return {
    menuItems,
    menuTabVisible,
    debugBorders,
    displayResultsInline,
    editorMode,
    currentFileContents,
  };
}

type DispatchProps = {
  setEditorMode: (mode: EditorMode) => void,
  setDebugBorders: (debugBorders: boolean) => void,
  setDisplayResultsInline: (displayResultsInline: boolean) => void,
};

function mapDispatchToProps(dispatch: (action: Action) => any): DispatchProps {
  return {
    setEditorMode: (mode: EditorMode) => {
      dispatch({ type: 'update', key: 'editorMode', value: mode });
    },
    setDebugBorders: (debugBorders: boolean) => {
      dispatch({ type: 'update', key: 'debugBorders', value: debugBorders });
    },
    setDisplayResultsInline: (displayResultsInline) => {
      dispatch({ type: 'update', key: 'displayResultsInline', value: displayResultsInline });
    },
  };
}

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type MenuProps = PropsFromRedux & DispatchProps & StateProps;

function Menu({
  menuItems,
  menuTabVisible,
  setEditorMode,
  debugBorders,
  setDebugBorders,
  displayResultsInline,
  setDisplayResultsInline,
  editorMode,
  currentFileContents,
}: MenuProps) {
  const [encodedUrl, setEncodedUrl] = React.useState<false | string>(false);

  function getTab() {
    if (menuTabVisible === false) {
      return false;
    }

    switch (menuItems[menuTabVisible].name) {
      case 'Files':
        return (
          <FSBrowser />
        );
      case 'Options':
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                height: '2.7em',
              }}
            >
              <button
                onClick={() => setEditorMode(EditorMode.Text)}
                className="option"
                key="TextEditor"
                type="button"
                style={{
                  width: '50%',
                }}
              >
                Text
              </button>
              <button
                onClick={() => setEditorMode(EditorMode.Chunks)}
                className="option"
                key="ChunkEditor"
                type="button"
                style={{
                  width: '50%',
                }}
              >
                Chunks
              </button>
            </div>
            <FontSize key="FontSize" />
            {editorMode === EditorMode.Chunks && (
              <button
                onClick={() => setDebugBorders(!debugBorders)}
                className="option"
                key="debugBorders"
                type="button"
                style={{
                  height: '2.7em',
                }}
              >
                {debugBorders ? (
                  'Turn off debug borders'
                ) : (
                  'Turn on debug borders'
                )}
              </button>
            )}
            {editorMode === EditorMode.Chunks && (
              <button
                onClick={() => setDisplayResultsInline(!displayResultsInline)}
                className="option"
                key="displayResultsInline"
                type="button"
                style={{
                  height: '2.7em',
                }}
              >
                {displayResultsInline ? (
                  'Turn off inline results'
                ) : (
                  'Turn on inline results'
                )}
              </button>
            )}
            {editorMode === EditorMode.Chunks && (
              <div
                style={{
                  width: '100%',
                }}
              >
                <button
                  onClick={() => {
                    if (currentFileContents !== undefined) {
                      setEncodedUrl(`${document.location.origin}${document.location.pathname}?program=${encodeURIComponent(currentFileContents)}`);
                    }
                  }}
                  className="option"
                  key="getShareableLink"
                  type="button"
                  style={{
                    height: '2.7em',
                    width: '100%',
                  }}
                >
                  Get shareable link
                </button>
                {encodedUrl && (
                  <input
                    type="text"
                    value={encodedUrl}
                    readOnly
                    id="shareableLink"
                    className="option"
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    onFocus={(e) => {
                      e.target.select();
                      document.execCommand('copy');
                    }}
                    style={{
                      width: '100%',
                      height: '2.7em',
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      default:
        throw new Error(`Menu: unknown menu item name, ${menuItems[menuTabVisible].name}`);
    }
  }

  const tab = getTab();

  return (
    <div
      style={{
        height: '100%',
        background: '#c8c8c8',
        overflowY: tab === false ? undefined : 'scroll',
        minWidth: tab === false ? undefined : '16em',
      }}
    >
      {tab}
    </div>
  );
}

export default connector(Menu);
