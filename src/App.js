import { useState } from 'react'
import { Auth, Storage } from 'aws-amplify';
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
        console.log(file)
        const storageResult = await Storage.put('input/' + file.name, file, {
          level: 'private',
          type: 'audio/wav'
        })
        // Insert predictions code here later
        setUploaded(true);
        console.log(storageResult);
      }}>Upload and check if there's a midi created!</button>

      <View>
        {uploaded
          ? <div>Your Audio file is uploaded!</div>
          : <div>Upload an Audio WAV file to get started</div>}
      </View>
      <button onClick={async () => {
        const session = await Auth.currentSession()
        console.log(session);
        const result = await Storage.list('output/', {
          level: 'private',
          type: 'audio/midi'
        })
        console.log(result);
        document.querySelector('.tracks').innerHTML = '';
        result.results.forEach(item => createAudioPlayer(item))
      }}>List MIDI files</button>
      <div className="tracks"></div>
    </View>
    );
}

const createAudioPlayer = track => {
  if (track.key.endsWith('.midi')) {
    Storage.get(track.key, {
      level: 'private'
    }).then(result => {
      console.log(result)
      const audio = document.createElement('audio')
      const source = document.createElement('source')
      audio.appendChild(source)
      audio.setAttribute('controls', '')
      source.setAttribute('src', result)
      source.setAttribute('type', 'audio/midi')
      document.querySelector('.tracks').appendChild(audio)
    })
  }  
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