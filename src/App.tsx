import React from 'react';
import Truncate from './components/Truncate';

function App() {
  return (
    <div className="App">
      <Truncate lines={1} ellipsis=" 더보기">
        Lorem Ipsum <a href="google.com">google.com</a> is simply dummy text of the printing and typesetting industry.
        Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a
        galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also
        the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the
        release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software
        like Aldus PageMaker including versions of Lorem Ipsum.
      </Truncate>
    </div>
  );
}

export default App;
