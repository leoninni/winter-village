import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../src/systems/EventBus';

type TestEvents = { ping: undefined; found: { id: string } };

describe('EventBus', () => {
  it('delivers payloads to every listener', () => {
    const bus = new EventBus<TestEvents>();
    const a = vi.fn();
    const b = vi.fn();
    bus.on('found', a);
    bus.on('found', b);
    bus.emit('found', { id: 'old-skate' });
    expect(a).toHaveBeenCalledWith({ id: 'old-skate' });
    expect(b).toHaveBeenCalledOnce();
  });

  it('unsubscribes via the returned function', () => {
    const bus = new EventBus<TestEvents>();
    const fn = vi.fn();
    const off = bus.on('ping', fn);
    off();
    bus.emit('ping');
    expect(fn).not.toHaveBeenCalled();
  });

  it('lets a listener unsubscribe itself while being called', () => {
    const bus = new EventBus<TestEvents>();
    const later = vi.fn();
    const off = bus.on('ping', () => off());
    bus.on('ping', later);
    bus.emit('ping');
    bus.emit('ping');
    expect(later).toHaveBeenCalledTimes(2);
  });
});
