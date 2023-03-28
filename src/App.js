import './App.css';
import { useState, useRef } from 'react'
import { Storage } from 'aws-amplify';
import { withAuthenticator, Button, Heading, Text, SelectField, Flex, Divider, Link, SwitchField} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import MidiPlayer from 'react-midi-player';
import * as MidiConvert from 'midiconvert';
import * as Tone from 'tone'
import AudioReactRecorder, { RecordState } from 'audio-react-recorder'
import ReactAudioPlayer from 'react-audio-player';

function App({ signOut, user }) { 
  const [file, setFile] = useState();
  const [paramStyle, setParamStyle] = useState('default');
  const [uploaded, setUploaded] = useState(false);
  const [midiTrackReady, setMidiTrackReady] = useState(false);
  const [audioFileReady, setAudioFileReady] = useState(false);
  const [audioRecordingReady, setAudioRecordingReady] = useState(false);
  const [midiMasterFile, setMidiMasterFile] = useState(null);
  const [midiFile, setMidiFile] = useState(null);
  const [midiPlayOnLoad, setMidiPlayOnLoad] = useState(false);
  const [midiItems, setMidiItems] = useState([]);
  const [recordState, setRecordState] = useState(null);
  const [recordData, setRecordData] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioRecording, setAudioRecording] = useState(null);
  const [audioFileName, setAudioFileName] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const inputRef = useRef(null);

  const start = () => {
    setAudioRecordingReady(false);
    setRecordState(RecordState.START);
  }
 
  const stop = () => {
    setRecordState(RecordState.STOP);
  }

  const playOnLoad = () => {
    if (midiPlayOnLoad && midiMasterFile) {
      var synth = new Tone.PolySynth(Tone.Synth, 8).toDestination()
      
      MidiConvert.load(midiMasterFile, function(midi) {
        // make sure you set the tempo before you schedule the events
        Tone.Transport.bpm.value = midi.header.bpm
      
        // pass in the note events from one of the tracks as the second argument to Tone.Part 
        new Tone.Part(function(time, note) {
      
          //use the events to play the synth
          synth.triggerAttackRelease(note.name, note.duration, time, note.velocity)
      
        }, midi.tracks[0].notes).start()
      
        // start the transport to hear the events
        Tone.Transport.start()
      })
    }  
  }

  //audioData contains blob and blobUrl
  const onStop = (audioData) => {
    setRecordData(audioData);
    setAudioRecording(audioData.url);
    setAudioRecordingReady(true);
  }

  const playMidiTrack = trackShortName => {
    const item = midiItems.filter(item => item.trackShortName === trackShortName)[0];
    if (item !== null) {
      setMidiFile(item.midiFile);
      setMidiTrackReady(true);
    }  
  }
  const loadMidiFile = item => {
    if (item.key.endsWith('.midi') || item.key.endsWith('.mid')) {
      Storage.get(item.key, {
        level: 'private'
      }).then(result => {
        setMidiFile(result);
        const trackName = item.key.split('/')[1].split('.')[0];
        let trackShortName = 'default';
        if (!trackName.includes('track')) {
          setMidiMasterFile(result);
          setMidiFile(result);
          setMidiTrackReady(true);
          playOnLoad();
          trackShortName = 'master';
        } else {
          trackShortName = trackName.split('_')[2];
        }
        setMidiItems(midiItems => [...midiItems, {midiFile: result, key: item.key, muted: false, trackName: trackName, trackShortName: trackShortName}]);
      })
    }  
  }
  const handleClick = () => {
    inputRef.current.click();
  };

  return (
    <div className="App">
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
          <Heading level={4}>Audio WAV file Input</Heading>
          <input type="file" 
            style={{ display: 'none' }}
            ref={inputRef}
            onChange={(e) => { console.log(e); setFile(e.target.files[0]); setAudioFileName(e.target.files[0].name); setAudioFile(URL.createObjectURL(e.target.files[0])); setAudioFileReady(true);}} accept="audio/wav"/>
          <Button onClick={handleClick}>Upload</Button>
          {audioFileReady
            ? 
            <Flex direction="row" alignItems="center">
              <Text>{audioFileName}: </Text>
              <ReactAudioPlayer
                  src={audioFile}
                  controls
                />
            </Flex>
            : ""}
          <Flex direction="row" alignItems="center">
            <Button onClick={start}>Start Recording </Button>
            <Button onClick={stop}>Stop Recording</Button>
          </Flex>  
          <AudioReactRecorder state={recordState} onStop={onStop} canvasHeight="20.0rem"/>
          {audioRecordingReady
            ? 
            <Flex direction="row" alignItems="center">
              <Text>Recording: </Text>
              <ReactAudioPlayer
                  src={audioRecording}
                  controls
                />
            </Flex>
            : ""}
        </Flex>    
        <Divider
            orientation="horizontal" />
        <Flex direction="column" gap="1rem" alignItems="center" >
          <Heading level={4}>Upload</Heading>
          {uploaded
            ? <div>Your Audio file {uploadFile} is uploaded!</div>
            : <div>Upload Audio file or recording to get started</div>}  
          <Flex direction="row" alignItems="center">
            <Button isDisabled={!audioFileReady} onClick={async () => {
              setMidiItems([]);
              setMidiMasterFile(null);
              setMidiFile(null);
              setMidiTrackReady(false);
              const storageResult = await Storage.put('input/' + file.name, file, {
                metadata: { 'instrument-style': paramStyle},
                level: 'private',
                type: 'audio/wav'
              })
              setUploaded(true);
              setUploadFile(file.name);
              console.log(storageResult);
            }}>Upload File</Button>
            <Button isDisabled={!audioRecordingReady} onClick={async () => {
              setMidiItems([]);
              setMidiMasterFile(null);
              setMidiFile(null);
              setMidiTrackReady(false);
              await Storage.put('input/recording.wav', recordData.blob, {
                metadata: { 'instrument-style': paramStyle},
                level: 'private',
                type: 'audio/wav'
              })
              setUploaded(true);
              setUploadFile('Recording');
            }}>Upload Recording</Button>
          </Flex>
        </Flex>
        <Flex direction="column" gap="1rem" alignItems="center">  
          <SelectField
            label="Parameter Style"
            value={paramStyle}
            onChange={(e) => setParamStyle(e.target.value)}
          >
            <option value="default">default</option>
            <option value="voice">ensemble</option>
            <option value="guitar">guitar</option>
            <option value="piano">piano</option>
            <option value="ensemble">vocal</option>
          </SelectField>  
        </Flex>      
        <Divider
            orientation="horizontal" />
        <Flex direction="column" gap="1rem" alignItems="center" alignContent="center">
          <Heading level={4}>Midi Output</Heading>
          <Flex>
            <Button onClick={async () => {
              setMidiItems([]);
              setMidiMasterFile(null);
              setMidiFile(null);
              setMidiTrackReady(false);
              const result = await Storage.list('output/', {
                level: 'private',
                type: 'audio/midi'
              })
              result.results.forEach(item => {
                loadMidiFile(item);
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
          {midiItems.length > 0
          ? <Flex>  
              <SelectField
                label="Midi Tracks"
                onChange={(e) => playMidiTrack(e.target.value)}
                options={midiItems.map(item => item.trackShortName)}
              ></SelectField>  
            </Flex>  
          : <Flex></Flex>
        }  
        {midiTrackReady
          ? 
          <Flex direction="column" gap="1rem" alignItems="center">
            <MidiPlayer src={midiFile} />
            <Link color="#007EB9" href={midiFile}>
              Download
            </Link>
          </Flex>
          : ""}
        </Flex>     
        <Divider
          orientation="horizontal" />
        <Flex>
          <Link color="#007EB9" href="https://signal.vercel.app/" target="_blank">
            <b>Signal</b> - a fantastic Online MIDI Editor
          </Link>
        </Flex>
        <Divider
          orientation="horizontal" />
        <Flex>
          <Link color="#007EB9" href="mailto: jimomulloy@gmail.com">
            <b>Contact</b> jimomulloy@gmail.com <b>(Copyright Jim O'Mulloy)</b>
          </Link>
        </Flex>
        <Divider
          orientation="horizontal" />
      </Flex>
    </div>  
    );
}

export default withAuthenticator(App);