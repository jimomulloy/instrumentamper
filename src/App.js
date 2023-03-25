import { useState } from 'react'
import { Auth, Storage } from 'aws-amplify';
import { withAuthenticator, Button, Heading, View, SelectField, Card, Grid } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import MidiPlayer from 'react-midi-player';
import AudioReactRecorder, { RecordState } from 'audio-react-recorder'
import ReactAudioPlayer from 'react-audio-player';

function App({ signOut, user }) { 
  const [file, setFile] = useState();
  const [paramStyle, setParamStyle] = useState('default');
  const [uploaded, setUploaded] = useState(false);
  const [audioFileReady, setAudioFileReady] = useState(false);
  const [midiFile, setMidiFile] = useState(null);
  const [recordState, setRecordState] = useState(null);
  const [recordData, setRecordData] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const start = () => {
    setAudioFileReady(false);
    setRecordState(RecordState.START);
  }
 
  const stop = () => {
    setRecordState(RecordState.STOP);
  }

  //audioData contains blob and blobUrl
  const onStop = (audioData) => {
    setRecordData(audioData);
    setAudioFile(audioData.url);
    setAudioFileReady(true);
    console.log('audioData', audioData);
  }

  const getMidiFile = midiFile => {
    if (midiFile.key.endsWith('.midi') || midiFile.key.endsWith('.mid')) {
      Storage.get(midiFile.key, {
        level: 'private'
      }).then(result => {
        console.log(result)
        setMidiFile(result);
      })
    }  
  }

  return (
    <Grid
      templateRows="1fr 3fr, 1fr, 1fr 1fr"
      rowGap="1.5rem"
      column-gap="10.0rem"
      alignContent="centre"
      justifyContent="centre"
    >
    <View style={styles.container}>
      <View>
        <Heading level={3}>Instrument Amp</Heading>
        <p/>
      </View>
      <View>
        <Heading level={5}>Hello {user.username}</Heading>
        <p/>
        <Button onClick={signOut}>Sign out</Button>
        <p/>
      </View>  
      <View>
         <Card>
          <Heading level={3}>Audio Input</Heading>
          <p/>
          <div>
            <input type="file" onChange={(e) => { setFile(e.target.files[0]); setAudioFile(e.target.files[0].name); setAudioFileReady(false);}} accept="audio/wav"/>
          </div>  
          <div>
              <AudioReactRecorder state={recordState} onStop={onStop} canvasHeight="20.0rem"/>
              <button onClick={start}>Start Recording </button>
              <spacer type="horizontal" width="100" height="100"> - </spacer>
              <button onClick={stop}>Stop Recording</button>
            </div>
          {audioFileReady
            ? 
            <div>
               <ReactAudioPlayer
                src={audioFile}
                autoPlay
                controls
              />
            </div>
            : 
            <div>
            </div>}  
          <p/>
          <SelectField
            label="Parameter Style"
            value={paramStyle}
            onChange={(e) => setParamStyle(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="voice">Voice</option>
            <option value="guitar">Guitar</option>
            <option value="piano">Piano</option>
            <option value="ensemble">Ensemble</option>
          </SelectField>
     
        </Card>
      </View>
      <View>
        <Card>              
          <Button onClick={async () => {
            console.log(file)
            const storageResult = await Storage.put('input/' + file.name, file, {
              metadata: { 'x-amz-meta-instrument-style': paramStyle},
              level: 'private',
              type: 'audio/wav'
            })
            setUploaded(true);
            console.log(storageResult);
          }}>Upload File</Button>
          <spacer type="horizontal" width="100" height="100"> - </spacer>
          <Button onClick={async () => {
            console.log(recordData)
            const storageResult = await Storage.put('input/' + 'recording.wav', recordData.blob, {
              metadata: { 'x-amz-meta-instrument-style': paramStyle},
              level: 'private',
              type: 'audio/wav'
            })
            setUploaded(true);
            console.log(storageResult);
          }}>Upload Recording</Button>
          {uploaded
            ? <div>Your Audio file is uploaded!</div>
            : <div>Upload an Audio WAV file to get started</div>}  
         </Card>  
      </View>
      <View>
        <Card>
          <Heading level={3}>Midi Output</Heading>
          <p/>
          <Button onClick={async () => {
            const session = await Auth.currentSession()
            console.log(session);
            const result = await Storage.list('output/', {
              level: 'private',
              type: 'audio/midi'
            })
            console.log(result);
            result.results.forEach(item => {
              getMidiFile(item);
            })
          }}>Load MIDI file</Button>
          <div>
              <h3>Midi Player</h3>
              <MidiPlayer src={midiFile} />
          </div>
        </Card>
      </View>
    </View>  
    </Grid>
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