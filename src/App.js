import { useState } from 'react'
import { Storage } from 'aws-amplify';
import { withAuthenticator, Button, Heading, View } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

function App({ signOut, user }) { 
  const [file, setFile] = useState();
  const [uploaded, setUploaded] = useState(false);

  return (
    <View style={styles.container}>
      <Heading level={1}>Hello {user.username}</Heading>
      <Button onClick={signOut}>Sign out</Button>
      <h2>Instrument Amp</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={async () => {
        const storageResult = await Storage.put('input/test.wav', file, {
          level: 'private',
          type: 'audio/wav'
        })
        // Insert predictions code here later
        setUploaded(true)
        console.log(storageResult);
      }}>Upload and check if there's a midi created!</button>

      <View>
        {uploaded
          ? <div>Your Audio file is uploaded!</div>
          : <div>Upload an Audio WAV file to get started</div>}
      </View>
    </View>
    );
}

const styles = {
  container: { width: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20 },
  todo: {  marginBottom: 15 },
  input: { border: 'none', backgroundColor: '#ddd', marginBottom: 10, padding: 8, fontSize: 18 },
  todoName: { fontSize: 20, fontWeight: 'bold' },
  todoDescription: { marginBottom: 0 },
  button: { backgroundColor: 'black', color: 'white', outline: 'none', fontSize: 18, padding: '12px 0px' }
}

export default withAuthenticator(App);