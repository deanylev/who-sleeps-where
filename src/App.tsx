import { ChangeEvent, Component } from 'react';
import './App.scss';

import { faker } from '@faker-js/faker';
import avatar from 'animal-avatar-generator';

import bedNames from './bed-names.json';

interface Bed {
  dirty: boolean;
  readonly emoji: string;
  name: string;
  sleeps: number;
}

interface Person {
  avatarSvg: string;
  name: string;
}

interface Result {
  bed: Bed;
  people: Person[];
}

interface Props {}

interface State {
  beds: Bed[];
  deciding: boolean;
  enableDrumroll: boolean;
  focusInput: { index: number; type: 'bed' | 'person' } | null;
  people: Person[];
  results: Result[] | null;
}

class App extends Component<Props, State> {
  get totalSpots() {
    return this.state.beds.reduce((a, b) => a + (b.sleeps || 1), 0);
  }

  constructor(props: Props) {
    super(props);

    this.state = {
      beds: [],
      deciding: false,
      enableDrumroll: localStorage.getItem('enable_drumroll') !== 'false',
      focusInput: null,
      people: [],
      results: null
    };
  }

  addBed() {
    const beds = [...this.state.beds];
    const names = beds.map(({ name }) => name);
    let name: string;
    do {
      name = bedNames[Math.floor(Math.random() * bedNames.length)];
    } while (names.includes(name));
    beds.push({
      dirty: false,
      get emoji() {
        return this.name.trim().toLowerCase().match(/couch|sleeper/) ? '🛋️' : '🛏️';
      },
      name,
      sleeps: 1
    });
    this.setState({
      beds,
      focusInput: {
        index: beds.length - 1,
        type: 'bed'
      }
    });
  }

  addPerson() {
    const people = [...this.state.people];
    const names = people.map(({ name }) => name);
    let name: string;
    do {
      name = faker.person.fullName();
    } while (names.includes(name));
    people.push({
      avatarSvg: this.generateAvatar(name),
      name
    });
    this.setState({
      focusInput: {
        index: people.length - 1,
        type: 'person'
      },
      people
    });
  }

  changePersonAvatar(index: number) {
    const people = [...this.state.people];
    const person = people[index];
    person.avatarSvg = this.generateAvatar(`${person.name}-${Math.random()}`);
    this.setState({
      people
    });
  }

  decide() {
    const { beds, enableDrumroll, people } = this.state;
    const remainingPeople = [...people];
    const results = [];

    for (let i = 0; i < beds.length; i++) {
      const bed = beds[i];
      const result: Result = {
        bed,
        people: []
      };

      for (let j = 0; j < bed.sleeps; j++) {
        const [person] = remainingPeople.splice(Math.floor(Math.random() * remainingPeople.length), 1);
        result.people.push(person);
      }

      results.push(result);
    }

    if (enableDrumroll) {
      this.setState({
        deciding: true,
        results
      }, () => {
        setTimeout(() => {
          this.setState({
            deciding: false
          });
        }, 3000);
      });
    } else {
      this.setState({
        results
      });
    }
  }

  generateAvatar(seed: string) {
    return avatar(seed, {
      size: 28
    });
  }

  getErrorMessage() {
    const { beds, people } = this.state;
    if (people.length < 2) {
      return 'Add at least two people';
    }

    if (beds.length < 2) {
      return 'Add at least two beds';
    }

    if (this.totalSpots !== people.length) {
      return 'Make sure the number of people matches the number of spots';
    }

    const peopleNames = people.map(({ name }) => name.trim());
    if (peopleNames.length !== new Set(peopleNames).size) {
      return 'Make sure every name is unique';
    }

    const bedNames = beds.map((bed) => bed.name.trim());
    if (bedNames.length !== new Set(bedNames).size) {
      return 'Make sure every bed label is unique';
    }

    return null;
  }

  handleInputRef(type: 'bed' | 'person', index: number, input: HTMLInputElement | null) {
    if (!input) {
      return;
    }

    const { focusInput } = this.state;
    if (!focusInput) {
      return;
    }

    if (type !== focusInput.type || index !== focusInput.index) {
      return;
    }

    input.focus();
    input.select();
    this.setState({
      focusInput: null
    });
  }

  removeBed(index: number) {
    const beds = [...this.state.beds];
    beds.splice(index, 1);
    this.setState({
      beds
    });
  }

  removePerson(index: number) {
    const people = [...this.state.people];
    people.splice(index, 1);
    this.setState({
      people
    });
  }

  render() {
    const { totalSpots } = this;
    const { beds, deciding, enableDrumroll, people, results } = this.state;
    const errorMessage = this.getErrorMessage();

    return (
      <div className="App">
        <div className="body">
          <div className="heading">Who Sleeps Where?</div>
          {results
            ? deciding
              ? (
                  <></>
                ) : (
                  <>
                    <div className="results">
                      {results.map(({ bed, people }, index) => (
                        <div key={index}>
                          <div className="subHeading">{bed.emoji} {bed.name}</div>
                          <div className="people">
                            {people.map(({ avatarSvg, name }) => (
                              <div>
                                <div className="avatar" dangerouslySetInnerHTML={{ __html: avatarSvg }}></div>
                                <div className="name">{name}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => this.reset()}>Reset</button>
                  </>
                ) : (
                  <>
                    <div className="subHeading">Who ({people.length}):</div>
                    <button className="bottomMargin" onClick={() => this.addPerson()}>
                      <img alt="plus icon" src="plus.svg" />
                    </button>
                    <div className="people">
                      {people.map(({ avatarSvg, name }, index) => (
                        <div key={index}>
                          <button dangerouslySetInnerHTML={{ __html: avatarSvg }} onClick={() => this.changePersonAvatar(index)}></button>
                          <input onChange={(event) => this.setPersonName(index, event.target.value)} placeholder="Name" ref={(input) => this.handleInputRef('person', index, input)} value={name} />
                          <button onClick={() => this.removePerson(index)}>
                            <img alt="trash icon" src="trash.svg" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="subHeading">Where ({totalSpots}):</div>
                    <button className={beds.length === 0 ? 'bottomMargin' : ''} disabled={beds.length === 100} onClick={() => this.addBed()}>
                      <img alt="plus icon" src="plus.svg" />
                    </button>
                    {beds.length > 0 && (
                      <div className="beds">
                        <div className="header">
                          <div className="spacer"></div>
                          <div className="wide">Label</div>
                          <div>Sleeps #</div>
                          <div className="spacer"></div>
                        </div>
                        {beds.map((bed, index) => (
                          <div className="bed" key={index}>
                            <div className="emoji">
                              {bed.emoji}
                            </div>
                            <input onChange={(event) => this.setBedProperty(index, 'name', event.target.value)} placeholder="Name" ref={(input) => this.handleInputRef('bed', index, input)} type="text" value={bed.name} />
                            <input min={0} onBlur={(event) => this.setBedSleeps(index, event, true)} onChange={(event) => this.setBedSleeps(index, event)} placeholder="Sleeps" type="number" value={bed.sleeps} />
                            <button onClick={() => this.removeBed(index)}>
                              <img alt="trash icon" src="trash.svg" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="error">{errorMessage}</div>
                    <button className="bottomMargin" disabled={!!errorMessage} onClick={() => this.decide()}>Decide</button>
                    <button className="reset" onClick={() => this.reset()}>Reset</button>
                    <label>
                      <input checked={enableDrumroll} onChange={(event) => this.setEnableDrumroll(event.target.checked)} type="checkbox" />
                      <span>Enable Drumroll</span>
                    </label>
                  </>
                )
          }
          <img alt="drumroll animation" className={deciding ? '' : 'hide'} src="drumroll.gif" />
        </div>
        <div className="footer">
          Made by <a href="https://deanlevinson.com.au" rel="noreferrer" target="_blank">Dean Levinson</a> | <a className="colorSecondary" href="https://github.com/deanylev/who-sleeps-where" rel="noreferrer" target="_blank">Source</a>
        </div>
      </div>
    );
  }

  reset() {
    this.setState({
      beds: [],
      people: [],
      results: null
    });
  }

  setBedSleeps(index: number, event: ChangeEvent<HTMLInputElement>, fallback = false) {
    let value = parseInt(event.target.value, 10);
    if (fallback) {
      value = value || 1;
    }
    this.setBedProperty(index, 'sleeps', value);
  }

  setBedProperty<T extends keyof Bed>(index: number, key: T, value: Bed[T]) {
    const beds = [...this.state.beds];
    const bed = beds[index];
    bed[key] = value;

    if (key === 'name') {
      bed.dirty = true;
    }
    this.setState({
      beds
    });
  }

  setEnableDrumroll(enabled: boolean) {
    localStorage.setItem('enable_drumroll', enabled ? 'true' : 'false');
    this.setState({
      enableDrumroll: enabled
    });
  }

  setPersonName(index: number, name: string) {
    const people = [...this.state.people];
    people[index].name = name;
    this.setState({
      people
    });
  }
}

export default App;
