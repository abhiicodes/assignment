import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Canvas from './components/Canvas';
import NodeSidebar from './components/NodeSidebar';
import JsonPreview from './components/JsonPreview';
import Toolbar from './components/Toolbar';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ReactFlowProvider>
        <div className="app">
          <Toolbar />
          <div className="app-body">
            <div className="canvas-panel">
              <Canvas />
              <JsonPreview />
            </div>
            <NodeSidebar />
          </div>
        </div>
      </ReactFlowProvider>
    </Provider>
  );
};

export default App;
