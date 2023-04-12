import './App.css';
import { useEffect, useState, useRef } from 'react';
import { Storage } from 'aws-amplify';
import { withAuthenticator, Button, Heading, Image, Text, View, TextField, ScrollView, SelectField, Flex, Divider, Link} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import MidiPlayer from 'react-midi-player';
import ReactAudioPlayer from 'react-audio-player';
import { v4 as uuidv4 } from 'uuid';
import 'html-midi-player';
import LoadingOverlay from 'react-loading-overlay';
import usePoll from 'react-use-poll';

let gumStream = null;
let recorder = null;
let audioContext = null;
 
let isPolling = false; 

console.log('!!INIT!!');

function App({ signOut, user }) { 
  const [file, setFile] = useState();
  const [paramStyle, setParamStyle] = useState('default');
  const [uploaded, setUploaded] = useState(false);
  const [uploadFileKeyName, setUploadFileKeyName] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isStatusPolling, setIsStatusPolling] = useState(false);
  const [midiTrackReady, setMidiTrackReady] = useState(false);
  const [midiTrackPending, setMidiTrackPending] = useState(false);
  const [audioFileReady, setAudioFileReady] = useState(false);
  const [audioRecordingReady, setAudioRecordingReady] = useState(false);
  const [midiMasterFile, setMidiMasterFile] = useState(null);
  const [midiFile, setMidiFile] = useState(null);
  const [midiItems, setMidiItems] = useState([]);
  const [recordData, setRecordData] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioRecording, setAudioRecording] = useState(null);
  const [audioFileName, setAudioFileName] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const inputRef = useRef(null);
  const inputParameterFileRef = useRef(null);
  const [hasInstrumentOffsetError, setHasInstrumentOffsetError] = useState(false);
  const [hasInstrumentRangeError, setHasInstrumentRangeError] = useState(false);
  const [instrumentOffset, setInstrumentOffset] = useState("0");
  const [instrumentRange, setInstrumentRange] = useState("60");
  const [installerUrl, setInstallerUrl] = useState(null);
  const [state, setState] = useState({ status: 'READY' });
  const [width, setWidth] = useState(window.innerWidth);
  const [isMobile, setIsMobile] = useState(false);
 
  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
    setIsMobile(window.innerWidth <= 768)
  }
  
  useEffect(() => {
      window.addEventListener('resize', handleWindowSizeChange);
      return () => {
          window.removeEventListener('resize', handleWindowSizeChange);
      }
  }, []);
  
  const validateInstrumentOffset = (e) => {
    const containsDigit = /\d/.test(e.currentTarget.value);
    setHasInstrumentOffsetError(!containsDigit);
    if (containsDigit) {
      setInstrumentOffset(e.currentTarget.value);
    }
  };

  const validateInstrumentRange = (e) => {
    const containsDigit = /\d/.test(e.currentTarget.value);
    setHasInstrumentRangeError(!containsDigit);
    if (containsDigit) {
      setInstrumentRange(e.currentTarget.value);
    }
  };

  const startMSARecording = () => {
    setAudioRecordingReady(false);
    setIsRecording(true);
    let constraints = {
        audio: true,
        video: false
    }

    let AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    console.log("sample rate: " + audioContext.sampleRate);

    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
            console.log("initializing Recorder.js ...");
            gumStream = stream;
            let input = audioContext.createMediaStreamSource(stream);
            console.log("initializing A Recorder.js ...");
            recorder = new window.Recorder(input, {
                numChannels: 1
            })
            console.log("initializing B Recorder.js ...");
            recorder.record();
            console.log("Recording started");
        }).catch(function (err) {
            //enable the record button if getUserMedia() fails
          setAudioRecordingReady(false);
          setIsRecording(false);
    });
  }

  const stopMSARecording = () => {
    console.log("stopButton clicked");
    recorder.stop(); //stop microphone access
    gumStream.getAudioTracks()[0].stop();
    recorder.exportWAV(onMSAStop);
  }

  const onMSAStop = (blob) => {
    setIsRecording(false);
    console.log("uploading...");
    console.log(blob);
    console.log(URL.createObjectURL(blob));
    setRecordData({ blob: blob });
    setAudioRecording(URL.createObjectURL(blob));
    setAudioRecordingReady(true);
  }

  const playMidiTrack = trackShortName => {
    const item = midiItems.filter(item => item.trackShortName === trackShortName)[0];
    if (item !== null) {
      console.log('>>play trackShortName: ' + trackShortName);
      setMidiFile(item.midiFile);
      setMidiTrackReady(true);
    }  
  }

  const handleLoadAudioFile = (e) => {
    if (e.target.files.length > 0) {
      console.log(e); 
      setFile(e.target.files[0]); 
      setAudioFileName(e.target.files[0].name); 
      setAudioFile(URL.createObjectURL(e.target.files[0])); 
      setAudioFileReady(true);
    }  
  }

  const loadMidiFile = item => {
    if (item.key.endsWith('.midi') || item.key.endsWith('.mid')) {
      Storage.get(item.key, {
        level: 'private'
      }).then(result => {
        const trackName = item.key.split('/')[1].split('.')[0];
        let trackShortName = 'default';
        if (!trackName.includes('track')) {
          setMidiMasterFile(result);
          setMidiTrackReady(true);
          console.log('>>play master: ' + trackName);
          trackShortName = 'master';
          setMidiFile(result);
        } else {
          const trackNameParts = trackName.split('_');
          trackShortName = trackNameParts[trackNameParts.length - 1];
        }
        setMidiItems(midiItems => [...midiItems, {midiFile: result, key: item.key, muted: false, trackName: trackName, trackShortName: trackShortName}]);
      })
    }  
  }
  const handleClick = () => {
    inputRef.current.click();
  }; 

  const handleParameterFileClick = () => {
    inputParameterFileRef.current.click();
  }; 
  
  const handleLoadParameterFile = async (e) => {
    if (e.target.files.length > 0) {
      console.log(e); 
      await Storage.put('input/parameter.properties', e.target.files[0], {
        level: 'private',
        contentType: 'text/plain'
      })
    }  
  }

  const readState = async () => {
    let result = {};
    try {
      console.log('>>state read');
      result = await Storage.get('state.json', {
        level: 'private',
        download: true,
        cacheControl: 'no-cache',
        contentType: 'application/json' 
      });
    } catch(err) {
      console.log('>>state err: ' + err);
      const jsonResult = {status: 'READY'};
      setState(jsonResult);
      return jsonResult;
    }   
    console.log('>>state result : ' + result);
    console.log(result);
    try {
      const url = URL.createObjectURL(result.Body)
      const value = await result.Body.text();
      console.log(value);
      const jsonResult = JSON.parse(value);
      setState(jsonResult);
      return jsonResult;
    } catch(err) {
      console.log('>>state err: ' + err);
      const jsonResult = {status: 'READY'};
      setState(jsonResult);
      return jsonResult;
    }
  }

  const writeState = async (currentState) => {
    try {
      const stringState = JSON.stringify(currentState);
      const storageResult = await Storage.put('state.json', stringState, {
        level: 'private',
        contentType: 'application/json' 
      })
      console.log('>>writeState');
      console.log(storageResult);
    } catch(err) {
      console.log('>>writeState err: ' + err);
    }   
    setState(currentState);
  }

  const pollState = async () => {
    if (isPolling) {
      const currentState = await readState();
      console.log(currentState.status);
      const timeNowMS = Date.now();
      if (currentState.status === 'READY' || (!currentState.time) || (timeNowMS - currentState.time) > 20000) {
        isPolling = false;
        setIsStatusPolling(false);
      }  
    }
  }    

  usePoll(async () => {
    await pollState();
  }, [], {
    interval: 2000
  });

  // get the signed URL string
  const loadInstallerURL = async () => {
      const result = await Storage.get('InstrumentApp-0.0.1.exe', {
        level: 'public'
      })
      console.log('>>installer : ' + result);
      setInstallerUrl(result);
  }

  loadInstallerURL();

  return (
    <View as="header" padding="10px">
      <Flex wrap="nowrap" direction={{ base: 'column', large: 'row' }}>
        <View 
          maxWidth="400px"
          padding="1rem"
          width="100%" 
          border="1px solid var(--amplify-colors-black)" 
          boxShadow="3px 3px 5px 6px var(--amplify-colors-neutral-60)"
          backgroundColor="#E8EcF4"
          color="var(--amplify-colors-blue-60)">    
          <LoadingOverlay
            active={isPolling}
            spinner
            text='Processing audio ...'
            >    
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
                <Heading level={4}>Audio file Input</Heading>
                <input type="file" 
                  style={{ display: 'none' }}
                  ref={inputRef}
                  onChange={handleLoadAudioFile}
                  accept="audio/wav,audio/mp3,audio/ogg"/>
                <Button onClick={handleClick}>Load File</Button>
                {audioFileReady
                  ? 
                  <Flex direction="column" alignItems="center">
                    <ReactAudioPlayer
                        src={audioFile}
                        controls
                      />
                    <Text>{audioFileName}</Text>  
                  </Flex>
                  : ""}
                <Flex direction="row" alignItems="center">
                  <Button onClick={startMSARecording} isLoading={isRecording} loadingText="Recording...">Start Recording </Button>
                  <Button onClick={stopMSARecording} isDisabled={!isRecording}>Stop Recording</Button>
                </Flex>  
                {audioRecordingReady
                  ? 
                  <Flex direction="column" alignItems="center">
                    <ReactAudioPlayer
                        src={audioRecording}
                        controls
                      />
                    <Text>Recorded File</Text>  
                  </Flex>
                  : ""}
              </Flex>    
              <Divider
                  orientation="horizontal" />
              <Flex direction="column" gap="1rem" alignItems="center" >
                <Heading level={4}>Upload</Heading>
                {uploaded
                  ? <Text>Loaded {uploadFile}</Text>
                  : <Text>Upload Audio file or recording</Text>}  
                {state.status !== 'READY' && (audioFileReady || audioRecordingReady)
                    ? <Text>Busy, please try again in a few seconds</Text>
                    : ""}   
                <Flex direction="row" alignItems="center">
                  <Button isDisabled={!audioFileReady} onClick={async () => {
                    setMidiItems([]);
                    setMidiMasterFile(null);
                    setMidiFile(null);
                    setMidiTrackReady(false);
                    const currentState = await readState();
                    console.log('>>state set: ' + currentState);
                    console.log(currentState.status);
                    const timeNowMS = Date.now();
                    if (currentState.status === 'READY' || (!currentState.time) || (timeNowMS - currentState.time) > 20000) {
                      currentState.status = 'BUSY';
                      currentState.time = timeNowMS;
                      await writeState(currentState);
                      console.log('>>state written: ' + currentState);
                      isPolling = true;
                      setIsStatusPolling(true);
                      const storageResult = await Storage.put('input/' + file.name, file, {
                        metadata: { 'instrument-style': paramStyle, 'instrument-offset': instrumentOffset, 'instrument-range': instrumentRange },
                        level: 'private'
                      })
                      setUploaded(true);
                      setUploadFile(file.name);
                      setUploadFileKeyName(file.name.split('.')[0]);
                      console.log(storageResult);
                    }  
                  }}>Upload File</Button>
                  <Button isDisabled={!audioRecordingReady} onClick={async () => {
                    setMidiItems([]);
                    setMidiMasterFile(null);
                    setMidiFile(null);
                    setMidiTrackReady(false);
                    const currentState = await readState();
                    console.log('>>state set: ' + currentState);
                    console.log(currentState.status);
                    const timeNowMS = Date.now();
                    if (currentState.status === 'READY' || (!currentState.time) || (timeNowMS - currentState.time) > 20000) {
                      currentState.status = 'BUSY';
                      currentState.time = timeNowMS;
                      await writeState(currentState);
                      isPolling = true;
                      setIsStatusPolling(true);
                      let fileKeyName = 'recording-' + uuidv4();
                      setUploadFileKeyName(fileKeyName);
                      await Storage.put('input/' + fileKeyName + '.wav', recordData.blob, {
                        metadata: { 'instrument-style': paramStyle, 'instrument-offset': instrumentOffset, 'instrument-range': instrumentRange },
                        level: 'private'
                      })
                      setUploaded(true);
                      setUploadFile('Recording');
                    }  
                  }}>Upload Recording</Button>
                </Flex>
                <input type="file" 
                    style={{ display: 'none' }}
                    ref={inputParameterFileRef}
                    onChange={handleLoadParameterFile}
                    accept=".properties"/>
                    <Button onClick={handleParameterFileClick}>Load Parameter File</Button>
                <TextField
                    label="Offset"
                    defaultValue="0"
                    hasError={hasInstrumentOffsetError}
                    errorMessage="0 - duration of audio secs"
                    onChange={validateInstrumentOffset}
                    size="small"
                />
                <TextField
                  label="Range"
                  defaultValue="60"
                  hasError={hasInstrumentRangeError}
                  errorMessage="0 - 60secs"
                  onChange={validateInstrumentRange}
                  size="small"
                />
                  <SelectField
                    label="Parameter Style"
                    value={paramStyle}
                    onChange={(e) => setParamStyle(e.target.value)}
                  >
                    <option value="default">default</option>
                    <option value="vocal">vocal</option>
                    <option value="guitar">guitar</option>
                    <option value="piano">piano</option>
                    <option value="ensemble">ensemble</option>
                  </SelectField>  
              </Flex>         
              <Divider
                  orientation="horizontal" />
              <Flex direction="column" gap="1rem" alignItems="center" alignContent="center">
                <Heading level={4}>Download Midi Output</Heading>
                {state.status !== 'READY' && uploaded
                  ? <Text>Busy, please try again in a few seconds</Text>
                  : ""}   
                <Flex>
                  <Button isDisabled={!uploaded} onClick={async () => {
                    setMidiItems([]);
                    setMidiMasterFile(null);
                    setMidiFile(null);
                    setMidiTrackReady(false);
                    setMidiTrackPending(true);
                    const currentState = await readState();
                    console.log('>>state set: ' + currentState);
                    console.log(currentState.status);
                    const timeNowMS = Date.now();
                    if (currentState.status === 'READY' || (!currentState.time) || (timeNowMS - currentState.time) > 20000) {
                      const result = await Storage.list('output/', {
                        level: 'private',
                        type: 'audio/midi'
                      })
                      if (result.results.filter(item => 
                        item.key.split('/')[1].startsWith(uploadFileKeyName)
                          && (item.key.endsWith('.midi') || item.key.endsWith('.mid'))).length > 0) { 
                        result.results.forEach(item => {
                          loadMidiFile(item);
                        })
                        setMidiTrackPending(false);
                      }  
                    }  
                  }}>Load MIDI Tracks</Button>
                </Flex>    
                <Flex direction="column" gap="1rem" alignItems="center" alignContent="center">
                  {midiTrackPending
                  ? <Text>Upload Pending ...</Text>
                  : ""
                  }    
                  {midiItems.length > 0
                  ? <Flex direction="column" gap="1rem" alignItems="center">  
                      <SelectField
                        label="Midi Tracks"
                        onChange={(e) => playMidiTrack(e.target.value)}
                        options={midiItems.map(item => item.trackShortName)}
                      ></SelectField>  
                    </Flex>  
                  : ""
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
                  {midiItems.length > 0
                  ? <Flex direction="column" gap="1rem" alignItems="center" alignContent="center">
                      <Text>Master MIDI file</Text>
                      <midi-player
                        src={midiMasterFile} 
                        sound-font="https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus"
                        visualizer="#myStaffVisualizer">
                      </midi-player>
                      <midi-visualizer type="staff" id="myStaffVisualizer" src={midiMasterFile}>
                      </midi-visualizer>
                    </Flex>  
                  : ""}    
                </Flex>   
              </Flex>     
              <Divider
                orientation="horizontal" />
              <Flex>
                <a href={installerUrl} target="_blank" rel='noreferrer'><b>Download Windows Desktop Installer</b></a>
              </Flex>
              <Divider
                orientation="horizontal" />
              <Flex>
                <Link color="#007EB9" href="mailto: jimomulloy@gmail.com">
                  <b>Contact</b> jimomulloy@gmail.com
                </Link>
              </Flex>
              <Divider
                orientation="horizontal" />
            </Flex>
          </LoadingOverlay>   
        </View>  
        {!isMobile
         ? 
          <View 
            backgroundColor="var(--amplify-colors-white)"
            borderRadius="6px"
            border="1px solid var(--amplify-colors-black)"
            padding="2rem"
            boxShadow="3px 3px 5px 6px var(--amplify-colors-neutral-60)"
            color="var(--amplify-colors-blue-60)">
            <Flex direction="row" gap="2rem" alignItems="top" alignContent="center">
              <Flex direction="column" gap="2rem" alignItems="top" alignContent="flex-start">
                <Heading level={4}>Design</Heading>
                <Image
                  width="1800px"
                  alt="design"
                  src="./instrumentblocks.drawio.png"
                />
              </Flex>
              <Flex direction="column" gap="2rem" alignItems="top" alignContent="flex-start">
                <Heading level={4}>Screenshots</Heading>
                <Image
                  alt="tonemap1"
                  src="./tm1.png"
                /> 
                <Heading level={5}>Example 1</Heading>
                <Image
                  alt="tonemap2"
                  src="./tm2.png"
                />
                <Heading level={5}>Example 2</Heading>
              </Flex>
            </Flex>
          </View>        
         : ""}
      </Flex> 
    </View>  
    );
}

export default withAuthenticator(App);