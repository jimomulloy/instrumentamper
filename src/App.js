import { useState } from 'react'
import { Auth, Storage } from 'aws-amplify';
import { withAuthenticator, Button, Heading, View, SelectField, Card, Flex, Divider, Collection, Link, SwitchField} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
//import MidiPlayer from 'react-midi-player';
import MidiPlayer from 'web-midi-player';
import * as MidiConvert from 'midiconvert';
import * as Tone from 'tone'
import AudioReactRecorder, { RecordState } from 'audio-react-recorder'
import ReactAudioPlayer from 'react-audio-player';

function App({ signOut, user }) { 
  const [file, setFile] = useState();
  const [volume, setVolume] = useState(50);
  const [paramStyle, setParamStyle] = useState('default');
  const [uploaded, setUploaded] = useState(false);
  const [audioFileReady, setAudioFileReady] = useState(false);
  const [midiFile, setMidiFile] = useState(null);
  const [midiPlayOnLoad, setMidiPlayOnLoad] = useState(false);
  const [midiItems, setMidiItems] = useState([]);
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
        const trackName = midiFile.key.split('/')[1].split('.')[0];
        const midiPlayer = new MidiPlayer();
        midiItems.push({midiFile: result, key: midiFile.key, muted: false, trackName: trackName, midiPlayer: midiPlayer});

        if (midiPlayOnLoad) {
          var synth = new Tone.PolySynth().toDestination()
          
          MidiConvert.load(result, function(midi) {
          
            // make sure you set the tempo before you schedule the events
            Tone.Transport.bpm.value = midi.header.bpm
          
            // pass in the note events from one of the tracks as the second argument to Tone.Part 
            var midiPart = new Tone.Part(function(time, note) {
          
              //use the events to play the synth
              synth.triggerAttackRelease(note.name, note.duration, time, note.velocity)
          
            }, midi.tracks[0].notes).start()
          
            // start the transport to hear the events
            Tone.Transport.start()
          })
        }  
      })
    }  
  }

  return (
    <Flex direction="column" gap="1rem" alignItems="center">
      <Divider
          orientation="horizontal" />
      <Heading level={3}>Instrument Amp</Heading>
      <Divider
          orientation="horizontal" />
      <Flex direction="row" alignItems="center">
        <Heading level={5}>Hello {user.username}</Heading>
        <Button onClick={signOut}>Sign out</Button>
      </Flex>
      <Divider
          orientation="horizontal" />
      <Flex direction="column" gap="1rem" alignItems="center">  
        <Heading level={4}>Audio Input</Heading>
        <input type="file" onChange={(e) => { setFile(e.target.files[0]); setAudioFile(e.target.files[0].name); setAudioFileReady(false);}} accept="audio/wav"/>
        <Flex direction="row" alignItems="center">
          <Button onClick={start}>Start Recording </Button>
          <Button onClick={stop}>Stop Recording</Button>
        </Flex>  
        <AudioReactRecorder state={recordState} onStop={onStop} canvasHeight="20.0rem"/>
        {audioFileReady
          ? 
          <div>
            <ReactAudioPlayer
              src={audioFile}
              controls
            />
          </div>
          : ""}
      </Flex>    
      <Divider
          orientation="horizontal" />
      <Flex direction="column" gap="1rem" alignItems="center" >
        <Heading level={4}>Upload</Heading>
        {uploaded
          ? <div>Your Audio file is uploaded!</div>
          : <div>Upload an Audio WAV file to get started</div>}  
        <Flex direction="row" alignItems="center">
          <Button onClick={async () => {
            setMidiItems([]);
            console.log(file)
            const storageResult = await Storage.put('input/' + file.name, file, {
              metadata: { 'x-amz-meta-instrument-style': paramStyle},
              level: 'private',
              type: 'audio/wav'
            })
            setUploaded(true);
            console.log(storageResult);
          }}>Upload File</Button>
          <Button onClick={async () => {
            setMidiItems([]);
            console.log(recordData)
            const storageResult = await Storage.put('input/' + 'recording.wav', recordData.blob, {
              metadata: { 'x-amz-meta-instrument-style': paramStyle},
              level: 'private',
              type: 'audio/wav'
            })
            setUploaded(true);
            console.log(storageResult);
          }}>Upload Recording</Button>
        </Flex>
      </Flex>
      <Flex direction="column" gap="1rem" alignItems="center">  
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
      </Flex>      
      <Divider
          orientation="horizontal" />
      <Flex direction="column" gap="1rem" alignItems="center" alignContent="center">
          <Heading level={4}>Midi Output</Heading>
          <Flex>
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
            <SwitchField
              label="Play OnLoad"
              isChecked={midiPlayOnLoad}
              onChange={(e) => {
                setMidiPlayOnLoad(e.target.checked);
              }}
              />
          </Flex>    
          <Heading level={5}>Midi Tracks</Heading>
          <Collection
            items={midiItems}
            type="list"
            direction="column"
            gap="20px"
            wrap="nowrap"
          >
            {(item, index) => (
              <Card
                key={index}
                borderRadius="medium"
                maxWidth="20rem"
                variation="outlined"
              >
                <View padding="xs">
                  <Flex>
                    <Button
                           onClick={() =>
                             item.midiPlayer.play({ url: item.midiFile })
                           }
                       >
                        ▶️
                    </Button>
                    <SwitchField
                      label="Mute"
                      isChecked={item.muted}
                      onChange={(e) => {
                        item.muted = e.target.checked;
                      }}
                      />
                  </Flex>
                  <Divider padding="xs" />
                  <Heading padding="medium">{item.trackName}</Heading>
                  <Flex>
                    <Link color="#007EB9" href={item.midiFile}>
                      Download
                    </Link>
                  </Flex>              
                </View>
              </Card>
            )}
          </Collection>
        </Flex>
        <Divider
          orientation="horizontal" />
        <Flex>
          <Link color="#007EB9" href="https://signal.vercel.app/">
            <b>Signal</b> - a fantastic Online MIDI Editor
          </Link>
        </Flex>
        <Divider
          orientation="horizontal" />
    </Flex>
    );
}

export default withAuthenticator(App);