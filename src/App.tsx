import { Component } from 'react';
import './App.scss';

import { faker } from '@faker-js/faker';
import avatar from 'animal-avatar-generator';

interface Bed {
  dirty: boolean;
  getName: (beds: Bed[]) => string;
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
  focusInput: { index: number; type: 'bed' | 'person' } | null;
  people: Person[];
  results: Result[] | null;
}

class App extends Component<Props, State> {
  get totalSpots() {
    return this.state.beds.reduce((a, b) => a + b.sleeps, 0);
  }

  constructor(props: Props) {
    super(props);

    this.state = {
      beds: [],
      deciding: false,
      focusInput: null,
      people: [],
      results: null
    };
  }

  addBed() {
    const beds = [...this.state.beds];

    beds.push({
      dirty: false,
      getName: function(beds: Bed[]) {
        if (this.dirty) {
          return this.name;
        }

        return this.name || `Bed #${beds.indexOf(this) + 1}`;
      },
      name: '',
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
    const name = faker.person.fullName();
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
    const { beds, people } = this.state;
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
  }

  generateAvatar(seed: string) {
    return avatar(seed, {
      size: 35
    });
  }

  getErrorMessage() {
    const { beds, people } = this.state;
    if (people.length < 2) {
      return 'Need at least two people';
    }

    if (beds.length < 2) {
      return 'Need at least two beds';
    }

    if (this.totalSpots !== people.length) {
      return 'Number of people does not match number of spots';
    }

    const peopleNames = people.map(({ name }) => name.trim());
    if (peopleNames.length !== new Set<string>(peopleNames).size) {
      return 'Names must be unique';
    }

    const bedNames = beds.map((bed) => bed.getName(beds).trim());
    if (bedNames.length !== new Set<string>(bedNames).size) {
      return 'Bed labels must be unique';
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
    const { beds, deciding, people, results } = this.state;
    const errorMessage = this.getErrorMessage();

    return (
      <div className="App">
        <div className="body">
          <div className="heading">Who Sleeps Where?</div>
          {results ? deciding ? (
            <></>
          ) : (
            <>
              <div className="results">
                {results.map(({ bed, people }, index) => (
                  <div key={index}>
                    <div className="subHeading">{bed.getName(beds)}</div>
                    <div className="people">
                      {people.map(({ avatarSvg, name }) => (
                        <div className="person">
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
              <div className="subHeading">Who:</div>
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
              <button onClick={() => this.addPerson()}>
                <img alt="plus icon" src="plus.svg" />
              </button>
              <div className="subHeading">Where:</div>
              {beds.length > 0 && (
                <table className="beds">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Label</th>
                      <th>Sleeps How Many?</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {beds.map((bed, index) => (
                      <tr key={index}>
                        <td className="emoji">
                          🛏️
                        </td>
                        <td>
                          <input onChange={(event) => this.setBedProperty(index, 'name', event.target.value)} placeholder="Name" ref={(input) => this.handleInputRef('bed', index, input)} type="text" value={bed.getName(beds)} />
                        </td>
                        <td>
                          <input min={0} onChange={(event) => this.setBedProperty(index, 'sleeps', parseInt(event.target.value, 10))} placeholder="Sleeps" type="number" value={bed.sleeps} />
                        </td>
                        <td>
                          <button onClick={() => this.removeBed(index)}>
                            <img alt="trash icon" src="trash.svg" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button onClick={() => this.addBed()}>
                <img alt="plus icon" src="plus.svg" />
              </button>
              <div className="error">{errorMessage}</div>
              <button disabled={!!errorMessage} onClick={() => this.decide()}>Decide</button>
              <button className="reset" onClick={() => this.reset()}>Reset</button>
            </>
          )}
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

  setPersonName(index: number, name: string) {
    const people = [...this.state.people];
    people[index].name = name;
    this.setState({
      people
    });
  }
}

export default App;
